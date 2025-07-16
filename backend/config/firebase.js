const admin = require('firebase-admin');

// 1. Importamos el archivo de la clave de la cuenta de servicio.
const serviceAccount = require('./serviceAccountKey.json');

// 2. Comprobamos si la app ya está inicializada para evitar errores.
if (!admin.apps.length) {
  // 3. Inicializamos la app con las credenciales, la URL y el ID del proyecto.
  // Esta es la configuración más explícita posible.
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    // AÑADIMOS ESTA LÍNEA PARA SER MÁS EXPLÍCITOS
    projectId: serviceAccount.project_id,
  });
}

// 4. Obtenemos las instancias de los servicios que necesitamos.
const db = admin.firestore();
const auth = admin.auth();

// 5. Exportamos los servicios para que el resto de la app los use.
module.exports = { db, auth };
