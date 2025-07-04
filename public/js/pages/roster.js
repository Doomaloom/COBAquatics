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







onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('username').textContent = user.email;
        document.getElementById('sign-out-button').addEventListener('click', () => {
            signOut(auth);
        });
        document.getElementById('print-all-btn').addEventListener('click', () => {
            printAll();
        });
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            clearDB();
        });
        loadRosters();
    } else {
        document.getElementById('username').textContent = 'Guest';
        window.location.href = "index.html";
    }
});

async function clearDB() {
    const user = auth.currentUser;
    if (!user) return;

    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        return;
    }

    try {
        // Create a batch
        const batch = writeBatch(db);

        // Delete all student documents
        const studentsQuery = query(
            collection(db, "students"),
            where("uid", "==", user.uid)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        studentsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Delete all instructor documents
        const instructorsQuery = query(
            collection(db, "instructors"),
            where("uid", "==", user.uid)
        );
        const instructorsSnapshot = await getDocs(instructorsQuery);
        instructorsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Commit the batch
        await batch.commit();
        
        // Show success message and reload
        alert('All data has been cleared successfully.');
        window.location.reload();
        
    } catch (err) {
        console.error("Error clearing database:", err);
        alert("An error occurred while clearing the database. Please try again.");
    }
}

async function printRoster(code) {

    const students = await getClasslist(code.trim());
    const time = await getTime(code.trim());
    const instructor = await getInstructor(code.trim());
    const session = await getSession(code.trim());
    const location = await getLocation(code.trim());
    let level = await getLevel(code.trim());

    const levelSanitized = level.trim().replace(/\s+/g, '');

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const levelURL = `/swimming attendance/${levelSanitized}.html`;
    const fallbackURL = `/swimming attendance/SplashFitness.html`;

    try {
        const res = await fetch(levelURL, { method: 'HEAD' });
        iframe.src = res.ok ? levelURL : fallbackURL;
    } catch (err) {
        console.warn('Fetch failed, loading fallback');
        iframe.src = fallbackURL;
    }


    iframe.onload = () => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.getElementById("instructor").textContent = instructor;
        doc.getElementById("start_time").textContent = time;
        doc.getElementById("session").textContent = session;
        doc.getElementById("location").textContent = location;
        doc.getElementById("barcode").textContent = code;

        const tbody = doc.getElementById("student-rows");
        const totalColumns = tbody.children.length;
        const emptyCells = totalColumns - 1;

        students.forEach(name => {
            const row = doc.createElement("tr");
            row.innerHTML = `
              <td><strong style="font-family: Arial;">${name}</strong>
                <font size="2"><br><span style="text-decoration: underline;">A</span>bsent/<span style="text-decoration: underline;">P</span>resent<br>
                <span style="color: rgb(191, 191, 191);">[Day 1] [Day 2] [Day 3] [Day 4] [Day 5] [Day
										6] [Day 7] [Day 8] [Day 9] [Day 10] [Day 11] [Day 12] [Day 13] [Day 14]</span></font>
              </td>
              ${'<td>&nbsp;</td>'.repeat(emptyCells)}
            `;
            doc.getElementById("attendance-rows").appendChild(row);
        });

        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        setTimeout(() => document.body.removeChild(iframe), 1000);

    };
}

async function printAll() {
   const rosters = document.querySelectorAll('.roster');
   rosters.forEach(roster => {
       printRoster(roster.id);
   });
}

async function getClasslist(code) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const q = query(
                    collection(db, "students"),
                    where("uid", "==", user.uid),
                    where("code", "==", code)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    console.log(querySnapshot.docs[0].data());
                    const students = [];
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        console.log(data.name);
                        students.push(data.name.replaceAll("\"", ""));
                    });
                    resolve(students);
                }
                resolve([]);
            }
        });
    });
}

async function getTime(code) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const q = query(
                    collection(db, "students"),
                    where("uid", "==", user.uid),
                    where("code", "==", code)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    resolve(data.time);
                }
                resolve("");
            }
        });
    });
}

async function getInstructor(code) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const q = query(
                    collection(db, "students"),
                    where("uid", "==", user.uid),
                    where("code", "==", code)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    resolve(data.instructor);
                }
                resolve("");
            }
        });
    });
}

async function getSession(code) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const q = query(
                    collection(db, "students"),
                    where("uid", "==", user.uid),
                    where("code", "==", code)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    resolve("Summer 2025");
                }
                resolve("Summer 2025");
            }
        });
    });
}

async function getLocation(code) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const q = query(
                    collection(db, "students"),
                    where("uid", "==", user.uid),
                    where("code", "==", code)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    resolve(data.location);
                }
                resolve("");
            }
        });
    });
}

async function getLevel(code) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const q = query(
                    collection(db, "students"),
                    where("uid", "==", user.uid),
                    where("code", "==", code)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    resolve(data.level);
                }
                resolve("");
            }
        });
    });
}

async function loadRosters() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const q = query(
                    collection(db, "students"),
                    where("uid", "==", user.uid)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Create a map to group students by class code
                    const classesMap = new Map();

                    // First pass: group students by their class code
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        if (!classesMap.has(data.code)) {
                            classesMap.set(data.code, {
                                service_name: data.service_name,
                                time: data.time,
                                students: []
                            });
                        }
                        classesMap.get(data.code).students.push({
                            name: data.name,
                            instructor: data.instructor
                        });
                    });

                    // Convert map to array and sort by time
                    const sortedClasses = Array.from(classesMap.entries())
                        .map(([code, classData]) => ({
                            code,
                            ...classData
                        }))
                        .sort((a, b) => {
                            // Extract start time (e.g., "03:00 PM" from "03:00 PM-04:00 PM")
                            const timeA = a.time ? a.time.split('-')[0].trim() : '';
                            const timeB = b.time ? b.time.split('-')[0].trim() : '';

                            // Convert time to 24-hour format for comparison
                            const dateA = timeA ? new Date(`2000-01-01 ${convertTo24Hour(timeA)}`) : new Date(0);
                            const dateB = timeB ? new Date(`2000-01-01 ${convertTo24Hour(timeB)}`) : new Date(0);

                            return dateA - dateB;
                        });

                    // Clear existing content
                    const container = document.getElementById('main-content');
                    container.innerHTML = '';

                    // Create roster sections in sorted order
                    sortedClasses.forEach(classData => {
                        createRoster(classData.service_name, classData.time, classData.code);

                        // Add each student to the roster
                        classData.students.forEach(student => {
                            addStudentToRoster(
                                classData.code,
                                student.name.replaceAll("\"", ""),
                                student.instructor,
                                classData.service_name
                            );
                        });
                    });
                }

                const printBtns = document.getElementsByClassName('print-btn');

                Array.from(printBtns).forEach(btn => {
                    btn.addEventListener('click', () => printRoster(btn.parentElement.id));
                });
            } catch (error) {
                console.error("Error loading rosters: ", error);
            }
        }
    });
}

function createRoster(level, time, code) {
    const div = document.createElement("div");
    div.className = "roster";
    div.id = code;
    div.innerHTML = `
    <h2>${level} - ${time}</h2>
    <button type="button" class="print-btn" id="print-btn">Print</button>
    
  `;

    const container = document.getElementById('main-content');
    container.appendChild(div);
}

function addStudentToRoster(roster, student, instructor, level) {
    const div = document.createElement("div");
    div.className = "student";
    div.innerHTML = `
    <p>${student}</p>
    <select class="instructor-select" style="
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.6vw 2.5vw 0.6vw 0.8vw;
        font-size: 0.9vw;
        cursor: pointer;
        width: 100%;
        text-align: center;
        text-align-last: center;
        -moz-text-align-last: center;
        -webkit-text-align-last: center;
        background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
        background-repeat: no-repeat;
        background-position: calc(100% - 8px) center;
        background-size: 16px;
        transition: background-color 0.2s ease;
    ">
        <option value="">Select an instructor</option>
        <!-- Instructors will be loaded here -->
    </select>
    <select class="level-select">
        <option value="${level}">${level}</option>
        <optgroup label="Little Splash">
          <option value="LittleSplash1">Little Splash 1</option>
          <option value="LittleSplash2">Little Splash 2</option>
          <option value="LittleSplash3">Little Splash 3</option>
          <option value="LittleSplash4">Little Splash 4</option>
          <option value="LittleSplash5">Little Splash 5</option>
        </optgroup>
        <optgroup label="Parent and Tot">
          <option value="ParentandTot1">Parent and Tot 1</option>
          <option value="ParentandTot2">Parent and Tot 2</option>
          <option value="ParentandTot3">Parent and Tot 3</option>
        </optgroup>
        <optgroup label="Splash">
          <option value="Splash1">Splash 1</option>
          <option value="Splash2A">Splash 2A</option>
          <option value="Splash2B">Splash 2B</option>
          <option value="Splash3">Splash 3</option>
          <option value="Splash4">Splash 4</option>
          <option value="Splash5">Splash 5</option>
          <option value="Splash6">Splash 6</option>
          <option value="Splash7">Splash 7</option>
          <option value="Splash8">Splash 8</option>
          <option value="Splash9">Splash 9</option>
          <option value="SplashFitness">Splash Fitness</option>
        </optgroup>
        <optgroup label="Teen/Adult">
          <option value="SwimTeenAdult1">Teen/Adult 1</option>
          <option value="SwimTeenAdult2">Teen/Adult 2</option>
          <option value="SwimTeenAdult3">Teen/Adult 3</option>
        </optgroup>
    </select>
  `;
    
    const container = document.getElementById(roster);
    container.appendChild(div);
    
    // Load instructors into the dropdown
    loadInstructors(div, instructor, roster);
    
    // Get reference to the select elements
    const levelSelect = div.querySelector('.level-select');
    
    // Set the initial selected value
    levelSelect.value = level;
    
    // Handle level selection change
    levelSelect.addEventListener('change', async (e) => {
        const newLevel = e.target.value;
        if (newLevel) {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error('No user is signed in');
                    return;
                }

                const studentsRef = collection(db, 'students');
                const q = query(
                    studentsRef,
                    where('uid', '==', user.uid),
                    where('name', '==', "\"" + student + "\""),
                    where('code', '==', roster)
                );

                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const docRef = doc(db, 'students', querySnapshot.docs[0].id);
                    await updateDoc(docRef, {
                        level: newLevel
                    });
                    console.log(`Successfully updated ${student}'s level to ${newLevel}`);
                } else {
                    console.error('No matching student found to update');
                }
            } catch (error) {
                console.error('Error updating level:', error);
                alert('Failed to update level. Please try again.');
            }
        }
    });
}

// Function to load instructors into the dropdown
async function loadInstructors(container, currentInstructor, roster) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user is signed in');
            return;
        }

        // Get the instructor select element
        const instructorSelect = container.querySelector('.instructor-select');
        
        // Get instructors from the database
        const instructorsRef = collection(db, 'instructors');
        const q = query(instructorsRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const instructorsData = querySnapshot.docs[0].data();
            const instructors = instructorsData.name || [];
            
            // Clear existing options except the first one
            while (instructorSelect.options.length > 1) {
                instructorSelect.remove(1);
            }
            
            // Add instructors to the dropdown
            instructors.forEach(instructor => {
                if (instructor) { // Skip empty or undefined instructors
                    const option = document.createElement('option');
                    option.value = instructor;
                    option.textContent = instructor;
                    option.selected = (instructor === currentInstructor);
                    instructorSelect.appendChild(option);
                }
            });
            
            // Set up change handler for instructor selection
            instructorSelect.addEventListener('change', async (e) => {
                const newInstructor = e.target.value;
                if (newInstructor) {
                    try {
                        const studentsRef = collection(db, 'students');
                        const studentName = container.querySelector('p').textContent;
                        const q = query(
                            studentsRef,
                            where('uid', '==', user.uid),
                            where('name', '==', "\"" + studentName + "\""),
                            where('code', '==', roster)
                        );

                        const querySnapshot = await getDocs(q);
                        
                        if (!querySnapshot.empty) {
                            const docRef = doc(db, 'students', querySnapshot.docs[0].id);
                            await updateDoc(docRef, {
                                instructor: newInstructor
                            });
                            console.log(`Successfully updated ${studentName}'s instructor to ${newInstructor}`);
                        } else {
                            console.error('No matching student found to update');
                        }
                    } catch (error) {
                        console.error('Error updating instructor:', error);
                        alert('Failed to update instructor. Please try again.');
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading instructors:', error);
    }
}

// Helper function to convert 12-hour time to 24-hour format
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
