// backend/config/firebase.js

const admin = require('firebase-admin');

// --- Inicialización de Firebase Admin SDK ---
// Leemos la credencial desde las variables de entorno para mayor seguridad.
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

// Verificación crítica: si la variable de entorno no existe, la aplicación no puede funcionar.
if (!serviceAccountBase64) {
  console.error('ERROR FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
  process.exit(1); // Detiene la aplicación si no se puede conectar a Firebase.
}

// Decodificamos la credencial de Base64 a un string JSON.
const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
const serviceAccount = JSON.parse(serviceAccountString);

try {
  // Inicializamos la aplicación de Firebase solo si no ha sido inicializada antes.
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'enlapet.firebasestorage.app' // Asegúrate que este sea tu bucket de Storage
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
  }
} catch (error) {
    console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
    process.exit(1);
}

// Exportamos la instancia de la base de datos y el servicio de autenticación
// para que puedan ser utilizados en otros archivos (controladores).
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket();

module.exports = { db, auth, storage, admin };
