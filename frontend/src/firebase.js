// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <-- AGREGA ESTA LÍNEA

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD9o7uusX1JOBbuc9uHLXX-iZm3rc44MIE",
    authDomain: "seleccionesai.firebaseapp.com",
    projectId: "seleccionesai",
    storageBucket: "seleccionesai.firebasestorage.app",
    messagingSenderId: "364537876631",
    appId: "1:364537876631:web:3411f43e66425fa54b19d2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app); // <-- AGREGA ESTA LÍNEA
