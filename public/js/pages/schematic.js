import {
    auth,
    db,
    collection,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    browserLocalPersistence,
    setPersistence,
    signOut,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    getDoc,
    serverTimestamp,
    onSnapshot,
    query,
    where,
    deleteDoc,
    writeBatch
} from '../firebase.js';

// Global variables
let selected = [];
let multiSelect = false;

// DOM Elements
const selectDayBtn = document.getElementById("select-day-btn");

// Initialize day selection from localStorage
const savedDay = localStorage.getItem("selectedDay") || "";
window.day = savedDay;
if (selectDayBtn) {
    selectDayBtn.value = savedDay;
    selectDayBtn.addEventListener("change", () => {
        window.day = selectDayBtn.value;
        localStorage.setItem("selectedDay", selectDayBtn.value);
        // TODO: Add day change handler
        console.log(selectDayBtn.value);
    });
}

// Authentication state observer
// Wrap the auth state change logic in an async IIFE
onAuthStateChanged(auth, (user) => {
    (async () => {
        if (user) {
            document.getElementById('username').textContent = user.email;
            try {
                let schematic = [];

                const codes = await loadCodes(selectDayBtn.value);
                // Instead of forEach with async, use Promise.all with map
                const courses = await Promise.all(codes.map(async (code) => {
                    return {
                        code: code,
                        div: await createCodeField(code),
                        level: await getLevel(code),
                        runningTime: await getRunningTime(code),
                        startTime: await getStartTime(code),
                        endTime: await getEndTime(code)
                    };
                }));

                // Now sort the courses
                courses.sort((a, b) => {
                    const [hoursA, minutesA] = a.startTime.split(':').map(Number);
                    const [hoursB, minutesB] = b.startTime.split(':').map(Number);

                    if (hoursA !== hoursB) {
                        return hoursA - hoursB;
                    }
                    return minutesA - minutesB;
                });

                console.log(courses);
                courses.forEach((course) => {
                    console.log(course.startTime);
                    if (schematic.length === 0) {
                        schematic.push([course]);
                        console.log(schematic);
                    } else {
                        let added = false;
                        for (const column of schematic) {
                            const endHour = parseInt(column[column.length - 1].endTime.split(':')[0]);
                            const endMinute = parseInt(column[column.length - 1].endTime.split(':')[1]);
                            const startHour = parseInt(course.startTime.split(':')[0]);
                            const startMinute = parseInt(course.startTime.split(':')[1]);
                            
                            if (endHour < startHour || (endHour == startHour && endMinute <= startMinute)) {
                                column.push(course);
                                added = true;
                                break;
                            }
                        }
                        if (!added) {
                            schematic.push([course]);
                        }
                    }
                    
                    const earliestStartTime = courses[0].startTime;

                    const mainContent = document.getElementById('main-content');
                    mainContent.innerHTML = '';

                    // Create all column divs first
                    const columnDivs = schematic.map((_, index) => {
                        const columnDiv = document.createElement("div");
                        columnDiv.classList.add("column");
                        columnDiv.id = `column-${index}`;
                        
                        // Add instructor header
                        const instructorHeader = createInstructorHeader(index, ''); // Empty string for no default instructor
                        columnDiv.appendChild(instructorHeader);
                        
                        mainContent.appendChild(columnDiv);
                        return columnDiv;
                    });

                    // Then populate each column with its courses
                    schematic.forEach(async (column, index) => {
                        // Add gap at the beginning of the column if needed
                        if (column.length > 0 && column[0].startTime !== earliestStartTime) {
                            const gap = await getGap(earliestStartTime, column[0].startTime);
                            if (gap > 0) {
                                const gapDiv = document.createElement("div");
                                gapDiv.classList.add("gap");
                                gapDiv.style.height = `${gap / 5}rem`;
                                gapDiv.style.backgroundColor = "transparent";
                                columnDivs[index].appendChild(gapDiv);
                            }
                        }
                        
                        // Add all courses to the column with gaps in between
                        for (let i = 0; i < column.length; i++) {
                            const course = column[i];
                            
                            // Add gap between current and previous course if needed
                            if (i > 0) {
                                const prevCourse = column[i - 1];
                                const gap = await getGap(prevCourse.endTime, course.startTime);
                                if (gap > 0) {
                                    const gapDiv = document.createElement("div");
                                    gapDiv.classList.add("gap");
                                    gapDiv.style.height = `${gap / 5}rem`;
                                    gapDiv.style.backgroundColor = "transparent";
                                    columnDivs[index].appendChild(gapDiv);
                                }
                            }
                            
                            // Add the course
                            columnDivs[index].appendChild(course.div);
                        }
                    });
                });
            } catch (error) {
                console.error("Error loading codes:", error);
            }
        } else {
            document.getElementById('username').textContent = 'Guest';
            window.location.href = "index.html";
        }
    })();
});

// Sign out handler
const signOutButton = document.getElementById("sign-out-button");
if (signOutButton) {
    signOutButton.addEventListener("click", () => {
        signOut(auth);
        window.location.href = "index.html";
    });
}

// File upload handling
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");

if (dropZone && fileInput) {
    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length) {
        const file = files[0];
        // TODO: Process the file
        console.log("File selected:", file.name);
    }
}

// Add this near the top of your file, after other imports
const INSTRUCTORS = [
    'Instructor 1', 'Instructor 2', 'Instructor 3', 
    'Instructor 4', 'Instructor 5', 'Instructor 6'
];

// Add this function to create an instructor header
function createInstructorHeader(columnIndex, instructorName) {
    const header = document.createElement('div');
    header.className = 'instructor-header';
    
    const input = document.createElement('input');
    input.className = 'instructor-input';
    input.type = 'text';
    input.value = instructorName;
    input.dataset.columnIndex = columnIndex;
    
    header.appendChild(input);
    return header;
}

// Add this function to save the schedule
async function saveSchedule() {
    const schedule = [];
    const columns = document.querySelectorAll('.column');
    
    columns.forEach((column, index) => {
        const instructorInput = column.querySelector('.instructor-input');
        const instructor = instructorInput ? instructorInput.value.trim() : '';
        const courses = [];
        
        // Get all course divs in this column
        const courseDivs = column.querySelectorAll('.code-entry');
        courseDivs.forEach(div => {
            courses.push({
                code: div.id,  // or div.dataset.code if you're using data attributes
                // Add other course details as needed
            });
        });
        
        schedule.push({
            columnIndex: index,
            instructor: instructor,
            courses: courses
        });
    });
    
    try {
        // Here you would typically save to a database
        console.log('Saving schedule:', schedule);
        // Example: await saveToDatabase(schedule);
        alert('Schedule saved successfully!');
    } catch (error) {
        console.error('Error saving schedule:', error);
        alert('Failed to save schedule. Please try again.');
    }
}

// TODO: Add your specific schematic-related functions here

function convertTo24Hour(time12h) {
    if (!time12h) return '00:00';

    try {
        // Handle cases where time might be in format "03:00 PM-04:00 PM"
        const timePart = time12h.split('-')[0].trim();
        const [time, modifier] = timePart.split(' ');
        let [hours, minutes] = time.split(':');

        // Convert to numbers for arithmetic
        let hourNum = parseInt(hours, 10);

        // Handle PM times (except 12 PM)
        if (modifier === 'PM' && hourNum < 12) {
            hourNum += 12;
        }
        // Handle 12 AM (midnight)
        if (modifier === 'AM' && hourNum === 12) {
            hourNum = 0;
        }

        // Convert back to string and pad with leading zeros
        return `${hourNum.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
    } catch (error) {
        console.error('Error converting time:', time12h, error);
        return '00:00';
    }
};

async function getRunningTime(code) {
    let q = query(
        collection(db, "students"),
        where("uid", "==", auth.currentUser.uid),
        where("day", "==", day),
        where("code", "==", code)

    );
    const docSnap = await getDocs(q);
    if (!docSnap.empty) {
        let time = docSnap.docs[0].data().time;
        time.replace(" ", "");
        let times = time.split("-");
        let startTime = convertTo24Hour(times[0]);
        let endTime = convertTo24Hour(times[1]);
        let hours = parseInt(endTime.split(":")[0]) - parseInt(startTime.split(":")[0]);
        let minspre = hours * 60;
        let minutes = parseInt(endTime.split(":")[1]) - parseInt(startTime.split(":")[1]);
        return minspre + minutes;
    }

}

async function getLevel(code) {
    let q = query(
        collection(db, "students"),
        where("uid", "==", auth.currentUser.uid),
        where("day", "==", day),
        where("code", "==", code)

    );
    const docSnap = await getDocs(q);
    if (!docSnap.empty) {
        return docSnap.docs[0].data().service_name;
    }
}

async function getStartTime(code) {
    let q = query(
        collection(db, "students"),
        where("uid", "==", auth.currentUser.uid),
        where("day", "==", day),
        where("code", "==", code)

    );
    const docSnap = await getDocs(q);
    if (!docSnap.empty) {
        let time = docSnap.docs[0].data().time;
        time.replace(" ", "");
        let times = time.split("-");
        let startTime = convertTo24Hour(times[0]);
        return startTime;
    }
}

async function getEndTime(code) {
    let q = query(
        collection(db, "students"),
        where("uid", "==", auth.currentUser.uid),
        where("day", "==", day),
        where("code", "==", code)

    );
    const docSnap = await getDocs(q);
    if (!docSnap.empty) {
        let time = docSnap.docs[0].data().time;
        time.replace(" ", "");
        let times = time.split("-");
        let endTime = convertTo24Hour(times[1]);
        return endTime;
    }
}

async function loadCodes(day) {
    let temp_codes = [];
    let q = query(
        collection(db, "students"),
        where("uid", "==", auth.currentUser.uid),
        where("day", "==", day)
    );

    const docSnap = await getDocs(q);

    if (!docSnap.empty) {
        docSnap.forEach((doc) => {
            if (!temp_codes.includes(doc.data().code)) {
                temp_codes.push(doc.data().code);
            }
        });
    }
    return temp_codes;
}

async function loadInstructors(day) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            let instructorsRef = collection(db, "instructors");
            try {
                const q = query(
                    collection(db, "instructors"),
                    where("uid", "==", user.uid),
                    where("day", "==", day)
                )
                const docSnap = await getDocs(q);
                if (docSnap.docs.length > 0) {
                    const docRef = docSnap.docs[0].ref;
                    const instructors = docSnap.docs[0].data().name;
                    const codes = docSnap.docs[0].data().codes;

                    Array.from(instructors).forEach((instructor, index) => {
                        addInstructorField(instructor, codes[index]);
                    });
                    removeInstructorField(document.getElementsByClassName('instructor-entry')[0]);
                }
            } catch (error) {
                console.error("Error loading document: ", error);
            }
        }
    });
}

async function createCodeField(code) {
    const codeEntry = document.createElement('div');
    codeEntry.classList.add('code-entry');
    codeEntry.id = code;

    codeEntry.style.display = "flex";
    codeEntry.style.flexDirection = "column";
    codeEntry.style.width = "8rem";
    codeEntry.style.height = `${await getRunningTime(code) / 5}rem`;
    codeEntry.style.backgroundColor = "white";
    codeEntry.style.border = "1px solid black";

    codeEntry.innerHTML = `
      <p>${code}</p>
      <p>${await getLevel(code)}</p>
      <p>${await getRunningTime(code)}</p>
      <p>${await getStartTime(code)}</p>
      <p>${await getEndTime(code)}</p>
    `;
    return codeEntry;
}

async function getGap(startTime, endTime) {
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);
    const gapMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    return gapMinutes;
}
async function addCodeField(code) {
    const codeEntry = await createCodeField(code);
    document.getElementById('main-content').appendChild(codeEntry);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Initialization code here
    console.log("Schematic page initialized");
    document.getElementById('save-schematic').addEventListener('click', saveSchedule);
});