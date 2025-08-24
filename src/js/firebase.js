// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBE3JsQ89B73RDzUx_od5PdQEvJCll-i_g",
  authDomain: "gcc-live-count.firebaseapp.com",
  projectId: "gcc-live-count",
  storageBucket: "gcc-live-count.firebasestorage.app",
  messagingSenderId: "615997401345",
  appId: "1:615997401345:web:ff55009ea13db830c41300",
  measurementId: "G-BBQVBDT2C5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app)
const auth = getAuth(app);// for auth

export {
  db,
  auth
}