// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDvpD3Z1RruzhI8bGyIKZIHA1s0Cs_5oig",
    authDomain: "boda-shields-urquilla.firebaseapp.com",
    projectId: "boda-shields-urquilla",
    storageBucket: "boda-shields-urquilla.firebasestorage.app",
    messagingSenderId: "220696101396",
    appId: "1:220696101396:web:ea6de58a5a127b88465d01",
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos los servicios para usarlos en React
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();