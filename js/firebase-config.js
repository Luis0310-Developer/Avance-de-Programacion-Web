// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrcF8AEmFMpuDiO2DvhRoNoTNOuEXdRTo",
  authDomain: "stock-y-cuentas.firebaseapp.com",
  projectId: "stock-y-cuentas",
  storageBucket: "stock-y-cuentas.firebasestorage.app",
  messagingSenderId: "905052093877",
  appId: "1:905052093877:web:3dba8e6035dae03d852dfc",
  measurementId: "G-ZFWNNR4BGX"
};

// Intenta inicializar Firebase, si las credenciales son inválidas mostrará error pero no romperá toda la página
let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase inicializado correctamente con tus credenciales reales.");
} catch(error) {
    console.warn("No se pudo inicializar Firebase. Revisa la configuración en js/firebase-config.js", error);
}

export { auth, db };
