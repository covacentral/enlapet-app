// backend/index.js
// Versión Refactorizada y Corregida: Arquitectura Modular y Segura
// ACTUALIZACIÓN: Se añaden las rutas para el módulo de E-commerce (Órdenes y Pagos).

// --- 1. CONFIGURACIÓN E IMPORTACIONES ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- Importación de Módulos Locales ---
const authenticateUser = require('./middleware/authenticateUser');
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

// --- NUEVO: Importaciones para el módulo de E-commerce ---
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');

// --- 2. INICIALIZACIÓN DE LA APP ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 3. MIDDLEWARE GENERAL ---
const allowedOrigins = [
    'https://covacentral.shop',
    'https://www.covacentral.shop',
    'http://localhost:5173'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.json());

// --- 4. DEFINICIÓN DE RUTAS ---

// A. Rutas Públicas (No requieren autenticación)
app.get('/', (req, res) => res.json({ message: "¡Bienvenido a la API de EnlaPet! v1.5 - Módulo de E-commerce" }));
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
// El webhook de ePayco se registra aquí para que sea público
app.use('/api', paymentRoutes);


// B. Middleware de Autenticación
// A partir de este punto, TODAS las rutas subsiguientes requerirán un token.
app.use(authenticateUser);

// C. Rutas Protegidas
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
// --- NUEVO: Rutas protegidas de E-commerce ---
app.use('/api', orderRoutes);
// La ruta para crear la transacción también se registra aquí para protegerla
app.use('/api', paymentRoutes);


// --- 5. INICIAR SERVIDOR ---
app.listen(PORT, () => console.log(`Servidor con módulo de e-commerce corriendo en el puerto ${PORT}`));