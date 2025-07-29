// backend/config/firebase.js
// Módulo para la inicialización centralizada del Firebase Admin SDK.

const admin = require('firebase-admin');

// 1. Verificación robusta de la variable de entorno
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
  console.error('ERROR FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
  process.exit(1);
}

try {
  // 2. Decodificación y parseo seguro de las credenciales
  const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(serviceAccountString);

  // 3. Inicialización de la App de Firebase
  // Se comprueba si ya existe una app inicializada para evitar errores en entornos de recarga en caliente (hot-reloading)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'enlapet.firebasestorage.app' // Asegúrate de que este sea tu bucket correcto
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
  }
} catch (error) {
  console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
  process.exit(1);
}

// 4. Exportación de los servicios de Firebase para ser utilizados en toda la aplicación
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

module.exports = {
  db,
  auth,
  bucket
};