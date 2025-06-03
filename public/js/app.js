// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDx-jLnshGT-yna1GgQ7UbzchIWza5CQqE",
  authDomain: "cobaquatics-2449d.firebaseapp.com",
  projectId: "cobaquatics-2449d",
  storageBucket: "cobaquatics-2449d.firebasestorage.app",
  messagingSenderId: "1052870152564",
  appId: "1:1052870152564:web:6bf47fc199570293665c21",
  measurementId: "G-X23VC1SJW2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

function login(username, password) {
  // Import auth functionality

  const auth = getAuth();
  return signInWithEmailAndPassword(auth, username, password)
    .then((userCredential) => {
      // Signed in successfully
      const user = userCredential.user;
      return user;
    })
    .catch((error) => {
      // Handle errors
      const errorCode = error.code;
      const errorMessage = error.message;
      throw error;
    });
}

function signup(username, email, password) {
  const auth = getAuth();
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in successfully
      const user = userCredential.user;
      return user;
    })
    .catch((error) => {
      // Handle errors
      const errorCode = error.code;
      const errorMessage = error.message;
      throw error;
    });
}

// ----- COOKIE FUNCTIONS -----
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function getCookie(name) {
  const cookieArr = document.cookie.split(';');
  for (let cookie of cookieArr) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

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
function populateSavedSettings() {
  const instructorData = getCookie('instructorData');
  if (instructorData) {
    try {
      const instructors = JSON.parse(instructorData);
      const container = document.getElementById('instructor-fields');
      container.innerHTML = '';
      instructors.forEach(item => addInstructorField(item.name, item.codes));
    } catch (e) {
      console.error('Error parsing instructorData cookie', e);
    }
  }

  const formatData = getCookie('formatOptions');
  if (formatData) {
    try {
      const opts = JSON.parse(formatData);
      document.getElementById('roster_by_session').checked = opts.roster_by_session;
      document.getElementById('roster_by_series').checked = opts.roster_by_series;
      document.getElementById('time_headers').checked = opts.time_headers;
      document.getElementById('course_headers').checked = opts.course_headers;
      document.getElementById('instructor_headers').checked = opts.instructor_headers;
      document.getElementById('borders').checked = opts.borders;
      document.getElementById('center_time').checked = opts.center_time;
      document.getElementById('bold_time').checked = opts.bold_time;
      document.getElementById('center_course').checked = opts.center_course;
      document.getElementById('bold_course').checked = opts.bold_course;
    } catch (e) {
      console.error('Error parsing formatOptions cookie', e);
    }
  }
  updateFormattingOptions();
}

// ----- SAVE SETTINGS TO COOKIES ON FORM SUBMIT -----
function saveSettings() {
  if (document.getElementById('remember_instructors').checked) {
    const entries = [];
    document.querySelectorAll('.instructor-entry').forEach(div => {
      const name = div.querySelector('input[name="instructor_names[]"]').value.trim();
      const codes = div.querySelector('input[name="instructor_codes[]"]').value.trim();
      if (name) entries.push({ name, codes });
    });
    setCookie('instructorData', JSON.stringify(entries), 365);
  }
  if (document.getElementById('remember_formatting').checked) {
    const opts = {
      roster_by_series: document.getElementById('roster_by_series').checked,
      roster_by_session: document.getElementById('roster_by_session').checked,
      time_headers: document.getElementById('time_headers').checked,
      course_headers: document.getElementById('course_headers').checked,
      instructor_headers: document.getElementById('instructor_headers').checked,
      borders: document.getElementById('borders').checked,
      center_time: document.getElementById('center_time').checked,
      bold_time: document.getElementById('bold_time').checked,
      center_course: document.getElementById('center_course').checked,
      bold_course: document.getElementById('bold_course').checked
    };
    setCookie('formatOptions', JSON.stringify(opts), 365);
  }
}

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

// ----- INITIALIZATION -----
window.onload = () => {
  populateSavedSettings();
  updateFormattingOptions();
  initFileUpload();
  initSeriesSessionToggle();
  document.getElementById('time_headers').addEventListener('change', updateFormattingOptions);
  document.getElementById('course_headers').addEventListener('change', updateFormattingOptions);
  document.getElementById('upload-form').addEventListener('submit', saveSettings);
};