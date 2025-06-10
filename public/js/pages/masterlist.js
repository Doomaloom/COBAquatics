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



const addButton = document.getElementById('add-btn');
addButton.addEventListener('click', addInstructorField);


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

// ----- FORMAT OPTIONS MANAGEMENT -----
function updateFormattingOptions() {
  const timeHeaders = document.getElementById('time_headers');
  const courseHeaders = document.getElementById('course_headers');
  const boldTime = document.getElementById('bold_time');
  const centerTime = document.getElementById('center_time');
  const boldCourse = document.getElementById('bold_course');
  const centerCourse = document.getElementById('center_course');

  boldTime.disabled = !timeHeaders.checked;
  centerTime.disabled = !timeHeaders.checked;
  boldCourse.disabled = !courseHeaders.checked;
  centerCourse.disabled = !courseHeaders.checked;
}

// ----- POPULATE SAVED SETTINGS FROM COOKIES -----

// ----- FILE UPLOAD AND DRAG/DROP HANDLING -----
function initFileUpload() {
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const fileStatus = document.getElementById('file-status');

  fileInput.addEventListener('change', () => {
    fileStatus.textContent = fileInput.files.length
      ? `File Uploaded: ${fileInput.files[0].name}`
      : 'No file selected.';
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
  });
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.add('hover'));
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.remove('hover'));
  });
  dropZone.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      fileStatus.textContent = `File Uploaded: ${files[0].name}`;
    }
  });
  dropZone.addEventListener('click', () => fileInput.click());
}

// ----- SERIES / SESSION TOGGLE -----
function initSeriesSessionToggle() {
  const seriesCb = document.getElementById('roster_by_series');
  const sessionCb = document.getElementById('roster_by_session');

  seriesCb.addEventListener('change', () => {
    if (seriesCb.checked) sessionCb.checked = false;
  });
  sessionCb.addEventListener('change', () => {
    if (sessionCb.checked) seriesCb.checked = false;
  });
}

