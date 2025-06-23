import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth,signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, serverTimestamp, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

export { 
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
    getDoc,
    doc,  
    updateDoc,
    serverTimestamp,
    onSnapshot,
    query,
    where
 };