// backend/index.js
// Versión 1.8 - Integración del Módulo de Misiones

// --- 1. CONFIGURACIÓN E IMPORTACIONES ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');

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
const missionRoutes = require('./routes/mission.routes'); // <-- [NUEVO] Importamos las rutas de misiones

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
app.use(express.urlencoded({ extended: true }));

// --- 4. DEFINICIÓN DE RUTAS ---

// A. Rutas Públicas
app.get('/', (req, res) => res.json({ message: "¡Bienvenido a la API de EnlaPet! v1.8 - Misiones Habilitadas" }));
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.post('/api/payments/webhook', handleEpaycoWebhook);

// B. Middleware de Autenticación
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
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', missionRoutes); // <-- [NUEVO] Registramos las rutas de misiones

// --- 5. INICIAR SERVIDOR ---
app.listen(PORT, () => console.log(`Servidor con Misiones v2.2 corriendo en el puerto ${PORT}`));