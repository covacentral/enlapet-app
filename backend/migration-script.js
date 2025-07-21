// backend/migration-script.js

// Este script es para ser ejecutado UNA SOLA VEZ para actualizar
// los documentos de usuarios existentes a la nueva estructura de datos de la Fase 2.0.

require('dotenv').config();
const admin = require('firebase-admin');

// -----------------------------------------------------------------------------
// Inicialización de Firebase (copiado de index.js)
// -----------------------------------------------------------------------------
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!serviceAccountBase64) {
  console.error('ERROR FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
  process.exit(1);
}

const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
const serviceAccount = JSON.parse(serviceAccountString);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK inicializado para el script de migración.');
} catch (error) {
  console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
  process.exit(1);
}

const db = admin.firestore();

// -----------------------------------------------------------------------------
// Lógica de Migración
// -----------------------------------------------------------------------------
async function migrateUsers() {
  console.log('Iniciando migración de la colección "users"...');
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No se encontraron usuarios para migrar. Proceso finalizado.');
    return;
  }

  const batch = db.batch();
  let migratedCount = 0;

  snapshot.forEach(doc => {
    const user = doc.data();
    const updatePayload = {};

    // Verifica y añade cada nuevo campo/objeto si no existe
    if (user.userType === undefined) {
      updatePayload.userType = 'personal';
    }
    if (user.coverPhotoUrl === undefined) {
      updatePayload.coverPhotoUrl = '';
    }
    if (user.location === undefined) {
      updatePayload.location = {
        country: 'Colombia',
        department: '',
        city: ''
      };
    }
    if (user.privacySettings === undefined) {
      updatePayload.privacySettings = {
        profileVisibility: 'public',
        showEmail: 'private'
      };
    }
    // El campo 'phone' se eliminará si existe, ya que no es parte del modelo base.
    // Si deseas conservarlo, comenta la siguiente línea.
    if (user.phone !== undefined) {
        updatePayload.phone = admin.firestore.FieldValue.delete();
    }


    // Si hay algo que actualizar en este documento, se añade al batch
    if (Object.keys(updatePayload).length > 0) {
      console.log(`- Preparando migración para usuario: ${user.name} (${doc.id})`);
      batch.update(doc.ref, updatePayload);
      migratedCount++;
    }
  });

  if (migratedCount > 0) {
    console.log(`\nConfirmando cambios para ${migratedCount} usuarios...`);
    await batch.commit();
    console.log('¡Migración completada exitosamente!');
  } else {
    console.log('\nTodos los usuarios ya estaban actualizados. No se realizaron cambios.');
  }
}

migrateUsers().catch(error => {
  console.error('Ocurrió un error durante la migración:', error);
}).finally(() => {
    // Cierra la conexión de la base de datos para que el script termine
    db.app.delete();
});
