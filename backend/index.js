// backend/index.js
// VERSIÓN 2.1: Implementa una configuración de CORS robusta para Vercel y Render.

const express = require('express');
const cors = require('cors');
const { db } = require('./config/firebase');

// Middlewares
const authenticateUser = require('./middleware/authenticateUser');

// Importación de enrutadores
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const petRoutes = require('./routes/pets.routes');
const postRoutes = require('./routes/posts.routes');
const locationRoutes = require('./routes/locations.routes');
const eventRoutes = require('./routes/events.routes');
const notificationRoutes = require('./routes/notifications.routes');
const missionRoutes = require('./routes/mission.routes');
const vetRoutes = require('./routes/vet.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const verificationRoutes = require('./routes/verification.routes');
const productRoutes = require('./routes/product.routes');
const paymentRoutes = require('./routes/payment.routes');
const orderRoutes = require('./routes/order.routes');
const reportRoutes = require('./routes/reports.routes');
const publicRoutes = require('./routes/public.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- [NUEVA CONFIGURACIÓN DE CORS] ---
// Lista de orígenes fijos permitidos.
const allowedOrigins = [
    'http://localhost:5173',
    'https://enlapet.app'
];

// Expresión regular para permitir cualquier subdominio de Vercel de nuestro proyecto.
const vercelPreviewPattern = /^https:\/\/enlapet-app-.*\.vercel\.app$/;

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir solicitudes sin 'origin' (como Postman, apps móviles, etc.)
        if (!origin) {
            return callback(null, true);
        }
        
        // Permitir si el origen está en la lista fija O si coincide con el patrón de Vercel.
        if (allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
            callback(null, true);
        } else {
            // Si no coincide, rechazar la solicitud.
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Rutas Públicas ---
app.use('/api', publicRoutes);

// --- Rutas de Autenticación ---
app.use('/api', authRoutes);

// Middleware de autenticación para rutas protegidas
app.use(authenticateUser);

// --- Rutas Protegidas ---
app.use('/api', profileRoutes);
app.use('/api', petRoutes);
app.use('/api', postRoutes);
app.use('/api', locationRoutes);
app.use('/api', eventRoutes);
app.use('/api', notificationRoutes);
app.use('/api', missionRoutes);
app.use('/api', vetRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', verificationRoutes);
app.use('/api', productRoutes);
app.use('/api', paymentRoutes);
app.use('/api', orderRoutes);
app.use('/api', reportRoutes);

app.get('/', (req, res) => {
    res.send('Backend de EnlaPet funcionando correctamente.');
});

db.collection('users').limit(1).get()
    .then(() => console.log('Conexión a Firestore exitosa.'))
    .catch(err => console.error('Error de conexión a Firestore:', err));

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});