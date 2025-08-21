// backend/index.js
// VERSIÓN 2.0: Integra las rutas públicas y de reportes.

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
const reportRoutes = require('./routes/reports.routes'); // <-- [NUEVO] Importamos las rutas de reportes
const publicRoutes = require('./routes/public.routes');   // <-- [NUEVO] Importamos las rutas públicas

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
const allowedOrigins = [
    'http://localhost:5173',
    'https://enlapet.app',
    'https://enlapet-app-git-main-covacentral.vercel.app',
    process.env.VERCEL_URL // URL de preview de Vercel
];

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir solicitudes sin 'origin' (como las de Postman o apps móviles)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('enlapet-app-git-') || origin.includes('enlapet-app-covacentral')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Rutas Públicas ---
// Estas rutas no requieren el middleware de autenticación y deben ir primero.
app.use('/api', publicRoutes); // <-- [NUEVO] Usamos el enrutador público

// --- Rutas de Autenticación (también son públicas) ---
app.use('/api', authRoutes);


// A partir de aquí, todas las rutas requieren autenticación.
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
app.use('/api', reportRoutes); // <-- [NUEVO] Usamos el enrutador de reportes


// Endpoint de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('Backend de EnlaPet funcionando correctamente.');
});

// Test de conexión a Firestore al iniciar
db.collection('users').limit(1).get()
    .then(() => console.log('Conexión a Firestore exitosa.'))
    .catch(err => console.error('Error de conexión a Firestore:', err));

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});