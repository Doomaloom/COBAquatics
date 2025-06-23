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
  where 
} from '../firebase.js';



onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('username').textContent = user.email;
    loadFormatOptions();
    loadInstructors();
  } else {
    document.getElementById('username').textContent = 'Guest';
    window.location.href = "index.html";
  }
});

const signOutButton = document.getElementById("sign-out-button");
signOutButton.addEventListener("click", () => {
  signOut(auth);
  window.location.href = "index.html";
});

const addButton = document.getElementById('add-btn');
addButton.addEventListener('click', addInstructorField);

const toggleBtn = document.getElementsByClassName("option-check");
Array.from(toggleBtn).forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
  });
});


const fileStatus = document.getElementById('file-status');
const fileUpload = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input')
fileInput.addEventListener("change", function() {
  if (fileInput.files.length) {
    fileStatus.textContent = "File Uploaded: " + fileInput.files[0].name;
  }
})




// Handle dropped files
fileUpload.addEventListener('drop', function(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length) {
    fileInput.files = files;
    fileStatus.textContent = "File Uploaded: " + files[0].name;
  }
});


// ----- INSTRUCTOR FIELDS MANAGEMENT -----
function addInstructorField(name = "", codes = "") {
  const container = document.getElementById('instructor-fields');
  const div = document.createElement('div');
  div.className = 'instructor-entry';
  div.innerHTML = `
    <input type="text" name="instructor_names[]" placeholder="Instructor Name" value="${name}">
    <input type="text" name="instructor_codes[]" placeholder="Classes (comma separated)" value="${codes}">
    <button type="button" class="remove-btn">Remove</button>
  `;
  div.querySelector('.remove-btn').addEventListener('click', () => removeInstructorField(div));
  container.appendChild(div);
}

function removeInstructorField(div) {
  const container = document.getElementById('instructor-fields');
  if (container.getElementsByClassName('instructor-entry').length > 1) {
    container.removeChild(div);
  } else {
    div.querySelector('input[name="instructor_names[]"]').value = '';
    div.querySelector('input[name="instructor_codes[]"]').value = '';
  }
}

async function readIntoDB(csv, instructors, courseAssignments) {

  const SERVICE_NAME = 0;
  const CODE = 7;
  const DAY = 4;
  const TIME = 6;
  const LOCATION = 15;
  const SCHEDULE = 8;
  const NAME = 18;
  const PHONE = 20;

  const courseMap = {};

  instructors.forEach((instructor, index) => {
    const courses = courseAssignments[index];
    courses.split(",").forEach(course => {
      courseMap[course] = instructor;
    });
  });

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split("\n");

    for (let i = 1; i < lines.length - 1; i++) {
      const line_data = lines[i].split(",");
      console.log(line_data[NAME] + "," + line_data[NAME + 1]);
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          let studentsRef = collection(db, "students"); 
          try {
            const q = query(
              collection(db, "students"),
              where("uid", "==", user.uid),
              where("service_name", "==", line_data[SERVICE_NAME]),
              where("code", "==", line_data[CODE]),
              where("day", "==", line_data[DAY]),
              where("time", "==", line_data[TIME]),
              where("location", "==", line_data[LOCATION]),
              where("schedule", "==", line_data[SCHEDULE]),
              where("name", "==", line_data[NAME] + "," + line_data[NAME + 1]),
              where("phone", "==", line_data[PHONE])              
            );
            const docSnap = await getDocs(q);
            if (docSnap.docs.length > 0) {
              const docRef = docSnap.docs[0].ref;
              await updateDoc(docRef, {
                uid: user.uid,
                service_name: line_data[SERVICE_NAME],
                code: line_data[CODE],
                day: line_data[DAY],
                time: line_data[TIME],
                location: line_data[LOCATION],
                schedule: line_data[SCHEDULE],
                name: line_data[NAME] + "," + line_data[NAME + 1],
                phone: line_data[PHONE],
                instructor: courseMap[line_data[CODE]] ?? ""
              });
            }
            else {
              addDoc(studentsRef, {
                uid: user.uid,
                service_name: line_data[SERVICE_NAME],
                code: line_data[CODE],
                day: line_data[DAY],
                time: line_data[TIME],
                location: line_data[LOCATION],
                schedule: line_data[SCHEDULE],
                name: line_data[NAME] + "," + line_data[NAME + 1],
                phone: line_data[PHONE],
                instructor: courseMap[line_data[CODE]] ?? ""
              });
            }
          }
          catch (error) {
            console.error("Error adding document: ", error);
          }
        }
      })
    }
  };
  reader.readAsText(csv);



}

async function storeInstructors(formData) {

  const instructors = formData.getAll("instructor_names[]");
  const codes = formData.getAll("instructor_codes[]");

  console.log(instructors);
  console.log(codes);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let instructorsRef = collection(db, "instructors");
      try {
        const q = query(
          collection(db, "instructors"),
          where("uid", "==", user.uid)
        )
        const docSnap = await getDocs(q);
        if (docSnap.docs.length > 0) {
          const docRef = docSnap.docs[0].ref;
          await updateDoc(docRef, {
            name: instructors,
            codes: codes
          });
        }
        else {
          addDoc(instructorsRef, {
            uid: user.uid,
            name: instructors,
            codes: codes
          });
        }
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }
  });
}

async function loadInstructors() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let instructorsRef = collection(db, "instructors");
      try {
        const q = query(
          collection(db, "instructors"),
          where("uid", "==", user.uid)
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

async function storeFormatOptions(formatOptions) {

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let optionsRef = collection(db, "format_options");
      try {
        const q = query(
          collection(db, "format_options"),
          where("uid", "==", user.uid)
        )
        const docSnap = await getDocs(q);
        if (docSnap.docs.length > 0) {
          const docRef = docSnap.docs[0].ref;
          await updateDoc(docRef, {
            time_headers: formatOptions.includes("time_headers"),
            instructor_headers: formatOptions.includes("instructor_headers"),
            course_headers: formatOptions.includes("course_headers"),
            borders: formatOptions.includes("borders"),
            center_time: formatOptions.includes("center_time"),
            bold_time: formatOptions.includes("bold_time"),
            center_course: formatOptions.includes("center_course"),
            bold_course: formatOptions.includes("bold_course")
          });
        }
        else {
          addDoc(optionsRef, {
            uid: user.uid,
            time_headers: formatOptions.includes("time_headers"),
            instructor_headers: formatOptions.includes("instructor_headers"),
          course_headers: formatOptions.includes("course_headers"),
          borders: formatOptions.includes("borders"),
          center_time: formatOptions.includes("center_time"),
          bold_time: formatOptions.includes("bold_time"),
          center_course: formatOptions.includes("center_course"),
          bold_course: formatOptions.includes("bold_course")
        });
      } 
    }catch (error) {
      console.error("Error adding document: ", error);
    }
  }
});

}

async function loadFormatOptions() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let optionsRef = doc(db, "format_options", user.uid);
      const q = query(
        collection(db, "format_options"),
        where("uid", "==", user.uid)
      )
      try {
        const docSnap = await getDocs(q);
        if (docSnap.docs.length > 0) {
          const formatOptions = docSnap.docs[0].data();
          const formatButtons = document.getElementsByClassName("option-check");
          Array.from(formatButtons).forEach(btn => {
            if (formatOptions[btn.id]) {
              btn.classList.add("selected");
            }
          });
        }
      } catch (error) {
        console.error("Error loading document: ", error);
      }
    }
  });

}

function formatMasterList(e) {
  
  e.preventDefault();

  const form = document.getElementById("upload-form");
  const formData = new FormData(form);

  let formatOptions = [];

  const formatButtons = document.getElementsByClassName("option-check");
  

  try {
    console.log(formData.getAll("instructor_names[]"));
    console.log(formData.getAll("instructor_codes[]"));
    readIntoDB(formData.get("csv_file"), formData.getAll("instructor_names[]"), formData.getAll("instructor_codes[]"));

    Array.from(formatButtons).forEach(btn => {
      if (btn.classList.contains("selected")) {
        if (btn.id === "remember_instructors") {
          storeInstructors(formData);
        }
        if (btn.id === "remember_formatting") {
          storeFormatOptions(formatOptions);
        }
        formatOptions.push(btn.id);
      }
    });

    Array.from(formatOptions).forEach(opt => {
      console.log(opt);
      formData.append("selected_options[]", opt);
    });

    Array.from(formData).forEach(item => {
      console.log(item);
    });

    // Actual API call now
    fetch("https://csv-formatter-211408734673.northamerica-northeast2.run.app", {
      method: "POST",
      body: formData
    })
    .then(response => {
      if (!response.ok) throw new Error("Request failed");
      return response.blob(); // if backend sends a file (e.g. Excel)
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "masterlist.xlsx"; // your desired file name
      document.body.appendChild(a);
      a.click();
      a.remove();
    URL.revokeObjectURL(url);
    })
    
  } catch (err) {
    console.error(err);
  }
} 


document.getElementById("upload-form").addEventListener("submit", formatMasterList);
