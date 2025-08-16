// backend/config/firebase.js
// Versión 1.1: Añade soporte para Application Default Credentials (ADC).
// TAREA: Permite la inicialización del SDK en entornos de Google Cloud sin requerir variables de entorno.

const admin = require('firebase-admin');

// 1. Verificamos si la variable de entorno para Render existe.
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

try {
  if (!admin.apps.length) {
    if (serviceAccountBase64) {
      // --- LÓGICA PARA RENDER ---
      // Si la variable existe, decodificamos e inicializamos con ella.
      console.log('Inicializando Firebase Admin SDK con credenciales de Service Account...');
      const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'enlapet.firebasestorage.app'
      });
      console.log('SDK inicializado correctamente (Modo Render).');

    } else {
      // --- LÓGICA PARA GOOGLE CLOUD SHELL ---
      // Si no existe, inicializamos sin parámetros. El SDK buscará las credenciales del entorno.
      console.log('Inicializando Firebase Admin SDK con Application Default Credentials...');
      admin.initializeApp({
        storageBucket: 'enlapet.firebasestorage.app'
      });
      console.log('SDK inicializado correctamente (Modo Google Cloud).');
    }
  }
} catch (error) {
  console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
  process.exit(1);
}

// 2. Exportación de los servicios (sin cambios)
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

module.exports = {
  db,
  auth,
  bucket
};