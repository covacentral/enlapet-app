// backend/index.js
// Versión 1.8 - Añade Cloud Function para Migración de Datos
// TAREA: Se integra una función HTTP desplegable para ejecutar tareas de migración de forma segura.

// --- 1. CONFIGURACIÓN E IMPORTACIONES ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- [NUEVO] Importación de Firebase Functions ---
const functions = require('firebase-functions');

const authenticateUser = require('./middleware/authenticateUser');
const { handleEpaycoWebhook } = require('./controllers/payment.controller'); 

// Importación de Rutas
const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const petRoutes = require('./routes/pets.routes');
const profileRoutes = require('./routes/profile.routes');
const postRoutes = require('./routes/posts.routes');
const eventRoutes = require('./routes/events.routes');
const locationRoutes = require('./routes/locations.routes');
const notificationRoutes = require('./routes/notifications.routes');
const reportRoutes = require('./routes/reports.routes');
const verificationRoutes = require('./routes/verification.routes');
const vetRoutes = require('./routes/vet.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

// --- 2. INICIALIZACIÓN DE LA APP DE EXPRESS ---
const app = express();

// --- 3. MIDDLEWARE GENERAL ---
const allowedOrigins = [
    'https://covacentral.shop',
    'https://www.covacentral.shop',
    'http://localhost:5173'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com')) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 4. DEFINICIÓN DE RUTAS DE LA API ---
app.get('/', (req, res) => res.json({ message: "¡Bienvenido a la API de EnlaPet! v1.8 - Cloud Functions Ready" }));
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.post('/api/payments/webhook', handleEpaycoWebhook);
app.use(authenticateUser);
app.use('/api', petRoutes);
app.use('/api', profileRoutes);
app.use('/api', postRoutes);
app.use('/api', eventRoutes);
app.use('/api', locationRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reportRoutes);
app.use('/api', verificationRoutes);
app.use('/api', vetRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);


// --- 5. EXPORTACIÓN DE LA API PARA CLOUD FUNCTIONS ---
// Le decimos a Firebase que todas nuestras rutas de 'app' deben ser servidas bajo el endpoint /api
exports.api = functions.https.onRequest(app);


// --- 6. [NUEVO] CLOUD FUNCTION PARA MIGRACIÓN ---
exports.migrateVetLinks = functions.https.onRequest(async (req, res) => {
    // Medida de seguridad simple para evitar ejecuciones accidentales
    if (req.query.run !== 'true') {
        return res.status(400).send('Confirmación requerida. Añade "?run=true" a la URL para ejecutar.');
    }

    try {
        const db = admin.firestore();
        const petsRef = db.collection('pets');
        const snapshot = await petsRef.get();

        if (snapshot.empty) {
            return res.status(200).send('No se encontraron mascotas. No hay nada que migrar.');
        }

        let petsToUpdate = 0;
        const batch = db.batch();
        
        snapshot.docs.forEach(doc => {
            const petData = doc.data();
            const petRef = doc.ref;
            let needsUpdate = false;
            
            const activeVetIds = petData.activeVetIds || [];

            if (Array.isArray(petData.linkedVets) && petData.linkedVets.length > 0) {
                petData.linkedVets.forEach(link => {
                    if (link.status === 'active' && !activeVetIds.includes(link.vetId)) {
                        activeVetIds.push(link.vetId);
                        needsUpdate = true;
                    }
                });
            }

            if (needsUpdate) {
                batch.update(petRef, { activeVetIds });
                petsToUpdate++;
            }
        });

        if (petsToUpdate > 0) {
            await batch.commit();
            res.status(200).send(`¡Migración completada! Se actualizaron ${petsToUpdate} mascotas.`);
        } else {
            res.status(200).send('No se encontraron mascotas que necesiten actualización. La base de datos ya está consistente.');
        }

    } catch (error) {
        console.error('ERROR FATAL DURANTE LA MIGRACIÓN:', error);
        res.status(500).send('Error durante la migración. Revisa los logs de la función.');
    }
});