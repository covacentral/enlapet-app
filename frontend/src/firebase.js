// frontend/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Importamos Firebase Storage

// --- CONFIGURACIÓN SEGURA DE FIREBASE DESDE VARIABLES DE ENTORNO ---
// Leemos las credenciales desde las variables de entorno de Vite (import.meta.env)
// Esto evita exponer las claves en el código fuente.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verificación para asegurar que las variables de entorno se cargaron correctamente
if (!firebaseConfig.apiKey) {
  throw new Error("No se encontraron las variables de entorno de Firebase. Asegúrate de que tu archivo .env.local esté configurado.");
}

// Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// --- EXPORTACIÓN DE SERVICIOS DE FIREBASE ---
// Exportamos los servicios que usaremos en la aplicación.
export const auth = getAuth(app);
export const storage = getStorage(app); // Exportamos storage para la subida de archivos

export default app;
