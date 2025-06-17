import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  browserLocalPersistence, 
  setPersistence, 
  signOut, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  where 
} from '../firebase.js';



onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('username').textContent = user.email;
  } else {
    document.getElementById('username').textContent = 'Guest';
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
    <input type="text" name="instructor_names[]" placeholder="Instructor Name">
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

function readIntoDB(csv) {

}

function storeInstructors() {

}

function storeFormatOptions() {

}

function formatMasterList(e) {
  
  e.preventDefault();

  const form = document.getElementById("upload-form");
  const formData = new FormData(form);

  let formatOptions = [];

  const formatButtons = document.getElementsByClassName("option-check");
  

  try {
    Array.from(formatButtons).forEach(btn => {
      if (btn.classList.contains("selected")) {
        formatOptions.push(btn.textContent.trim());
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
    fetch("https://csv-formatter-211408734673.us-central1.run.app", {
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
