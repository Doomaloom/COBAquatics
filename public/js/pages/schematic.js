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
                        columnDiv.addEventListener('dragover', handleDragOver);
                        columnDiv.addEventListener('drop', handleDrop);
                        
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
    dropZone.addEventListener('drop', handleDrop1, false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
}

function handleDrop1(e) {
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
    codeEntry.classList.add('code-entry', 'draggable');
    codeEntry.id = code;
    codeEntry.draggable = true;
    codeEntry.dataset.code = code;

    // Store course data as data attributes for drag and drop
    const runningTime = await getRunningTime(code);
    const startTime = await getStartTime(code);
    const endTime = await getEndTime(code);
    const level = await getLevel(code);
    
    codeEntry.dataset.runningTime = runningTime;
    codeEntry.dataset.startTime = startTime;
    codeEntry.dataset.endTime = endTime;
    codeEntry.dataset.level = level;

    codeEntry.style.display = "flex";
    codeEntry.style.flexDirection = "column";
    codeEntry.style.width = "8rem";
    codeEntry.style.height = `${runningTime / 5}rem`;
    codeEntry.style.backgroundColor = "white";
    codeEntry.style.border = "1px solid black";
    codeEntry.style.marginBottom = "2px";
    codeEntry.style.cursor = "move";
    codeEntry.style.position = "relative";

    codeEntry.innerHTML = `
      <p>${code}</p>
      <p>${level}</p>
      <p>${runningTime} min</p>
      <p>${startTime} - ${endTime}</p>
    `;

    // Add drag event listeners
    codeEntry.addEventListener('dragstart', handleDragStart);
    codeEntry.addEventListener('dragend', handleDragEnd);
    codeEntry.addEventListener('dragenter', handleDragEnter);
    codeEntry.addEventListener('dragleave', handleDragLeave);

    return codeEntry;
}

// Global variables for drag and drop
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    // Don't do anything if dropping the same item we're dragging
    if (draggedItem === this) {
        return false;
    }

    // Check if the swap is valid
    if (findValidSwap(draggedItem, this) != null) {
        // Swap the courses
        swapCourses(draggedItem, findValidSwap(draggedItem, this));
    }

    return false;
}

function handleDragEnd() {
    this.style.opacity = '1';
    document.querySelectorAll('.column').forEach(item => {
        item.classList.remove('drag-over');
    });
}

//source is a code entry, target is a column
function findValidSwap(source, target) {
    const sourceTime = source.dataset.runningTime;
    const sourceStart = source.dataset.startTime;
    const sourceEnd = source.dataset.endTime;
    
    let swaps = [];

    for (let i = 1; i < target.children.length; i++) {
        const child = target.children[i];
        const childTime = child.dataset.runningTime;
        const childStart = child.dataset.startTime;
        const childEnd = child.dataset.endTime;

        console.log("Child start: ", childStart);
        console.log("Source end: ", sourceEnd);
        console.log("Gap: ", getGap(childStart, sourceEnd));
        
        if (childTime == sourceTime && childStart == sourceStart && childEnd == sourceEnd) {
            console.log("Valid swap found", child.dataset.level);
            return [child];
        }
        else if (childStart == sourceStart) {
            console.log("Same start time");
            swaps.push(child);
        }  
        else if (swaps.length > 0 && getGap(childStart, sourceEnd) >= 0) {
            console.log("Gap found");
            swaps.push(child);
            console.log("Swaps: ", swaps.length);
            if (childEnd == sourceEnd || i == target.children.length - 1) {
                console.log("Valid swap found", swaps.length);
                return swaps;
            }
        }
    }
    console.log("No valid swap found");
    return null;
}

function swapCourses(source, targets) {
    // Get parent elements
    const sourceParent = source.parentNode;
    const targetParent = targets[0].parentNode;

    const sourceNextSibling = source.nextSibling;
    const targetNextSibling = targets[targets.length - 1].nextSibling;
    
    if (targets.length == 1) {
        sourceParent.insertBefore(targets[0], sourceNextSibling);
        targetParent.insertBefore(source, targetNextSibling);
        console.log("Swap successful");
    } 
    else {
        for (let i = 0; i < targets.length; i++) {
            sourceParent.insertBefore(targets[i], sourceNextSibling);
            targetParent.insertBefore(source, targetNextSibling);
        }
        console.log("Swap successful");
    }
    
    // Update the UI
    updateCourseTimes();
}

function updateCourseTimes() {
    // This function would update the start/end times of all courses
    // based on their new positions in the DOM
    // Implementation depends on how times are calculated in your app
    console.log("Update course times after drag and drop");
}

function getGap(startTime, endTime) {
    if (startTime == undefined || endTime == undefined) {
        return null;
    }
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