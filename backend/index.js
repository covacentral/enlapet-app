// backend/index.js
// VERSIÓN 2.4: Corrige el orden de la ruta raíz para permitir pings de UptimeRobot.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const searchRoutes = require('./routes/search.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- [CONFIGURACIÓN CLAVE PARA RENDIMIENTO Y RATE LIMITS] ---
// Como la app está en Render (PaaS) detrás de un Load Balancer proxy,
// necesitamos confiar en el proxy para obtener la verdadera IP del usuario.
app.set('trust proxy', 1);

// --- [SEGURIDAD HTTP] ---
app.use(helmet());

// --- [RATE LIMITING] ---
const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    limit: 300, // 300 peticiones máximo por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiadas peticiones desde esta IP. Por favor espera unos minutos." }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 20, // 20 intentos de autenticación por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiados intentos de acceso repetidos. Por seguridad, intente más tarde." }
});

app.use(globalLimiter);

// --- [CONFIGURACIÓN DE CORS DEFINITIVA] ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://covacentral.shop',
    'https://www.covacentral.shop',
    'https://enlapet.com',
    'https://www.enlapet.com'
];

const vercelPreviewPattern = /^https:\/\/enlapet-app-.*\.vercel\.app$/;

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// --- LÍNEA MOVIDA ---
// Esta ruta ahora está ANTES del middleware de autenticación, haciéndola pública.
app.get('/', (req, res) => {
    res.send('Backend de EnlaPet funcionando correctamente.');
});

// Rutas Públicas y de Autenticación
app.use('/api', publicRoutes);
app.use('/api/register', authLimiter);
app.use('/api/google', authLimiter);
app.use('/api', authRoutes);

// Middleware de autenticación para rutas protegidas
app.use(authenticateUser);

// Rutas Protegidas
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
app.use('/api/search', searchRoutes);

db.collection('users').limit(1).get()
    .then(() => console.log('Conexión a Firestore exitosa.'))
    .catch(err => console.error('Error de conexión a Firestore:', err));

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});