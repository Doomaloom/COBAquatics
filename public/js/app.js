// Import all Firebase services
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
} from './firebase.js';


const login_email = document.getElementById('login-email');
const login_password = document.getElementById('login-password');

const signup_email = document.getElementById('signup-email');
const signup_password = document.getElementById('signup-password');

const signInButton = document.getElementById('sign-in-button');
const signUpButton = document.getElementById('sign-up-button');
const signOutButton = document.getElementById('sign-out-button');

const signed_out = document.getElementById('signed-out');
const signed_in = document.getElementById('signed-in');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  signInWithEmailAndPassword(auth, login_email.value, login_password.value)
    .then((userCredential) => {
      console.log('Successfully signed in:', userCredential.user.email);
      loginForm.reset();
    })
    .catch((error) => {
      console.error('Login error:', error.message);
      alert(error.message);
    });
});

// Handle signup form submission
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  createUserWithEmailAndPassword(auth, signup_email.value, signup_password.value)
    .then((userCredential) => {
      console.log('Successfully created account:', userCredential.user.email);
      signupForm.reset();
    })
    .catch((error) => {
      console.error('Signup error:', error.message);
      alert(error.message);
    });
});

signOutButton.onclick = () => {
  signOut(auth);
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    signOutButton.hidden = false;
    signed_out.hidden = true;
    signed_in.hidden = false;
    document.getElementById('username').textContent = user.email;
  } else {
    signOutButton.hidden = true;
    signed_out.hidden = false;
    signed_in.hidden = true;
    document.getElementById('username').textContent = 'Guest';
  }
});
