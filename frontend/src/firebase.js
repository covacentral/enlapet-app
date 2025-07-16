// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Importamos el servicio de autenticación

// Your web app's Firebase configuration (la que obtuviste de la consola)
const firebaseConfig = {
  apiKey: "AIzaSyBTPYaCM4Ghs3zpLSR0k1DS0AycRrotzBk", // Reemplaza con tu API Key
  authDomain: "enlapet.firebaseapp.com",
  projectId: "enlapet",
  storageBucket: "enlapet.firebasestorage.app",
  messagingSenderId: "421172827289",
  appId: "1:421172827289:web:98042910b5fcdb3e711408"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exportamos el servicio de autenticación para usarlo en otros componentes
export const auth = getAuth(app);