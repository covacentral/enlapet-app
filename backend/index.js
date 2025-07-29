// backend/index.js
// Versión Refactorizada: Arquitectura Modular
// Este archivo ahora actúa como el punto de entrada principal, conectando middlewares y enrutadores.

// --- 1. CONFIGURACIÓN E IMPORTACIONES ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- Importación de Módulos Locales ---
const authenticateUser = require('./middleware/authenticateUser');
const authRoutes = require('./routes/auth.routes');
const petRoutes = require('./routes/pets.routes');
const profileRoutes = require('./routes/profile.routes');
const postRoutes = require('./routes/posts.routes');
const eventRoutes = require('./routes/events.routes');
const locationRoutes = require('./routes/locations.routes');
const notificationRoutes = require('./routes/notifications.routes');
const reportRoutes = require('./routes/reports.routes');

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
app.get('/', (req, res) => res.json({ message: "¡Bienvenido a la API de EnlaPet! v1.0 - Arquitectura Refactorizada" }));
app.use('/api/auth', authRoutes); // Rutas de registro y login
app.use('/api', petRoutes); // Contiene /public/pets/:petId
app.use('/api', profileRoutes); // Contiene /public/users/:userId

// B. Middleware de Autenticación
// A partir de este punto, todas las rutas requerirán un token de autenticación válido.
app.use(authenticateUser);

// C. Rutas Protegidas
// Aquí registramos el resto de las rutas que ya están definidas en sus respectivos archivos.
// El middleware `authenticateUser` se aplicará automáticamente a todas ellas.
app.use('/api', postRoutes);
app.use('/api', eventRoutes);
app.use('/api', locationRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reportRoutes);

// --- 5. INICIAR SERVIDOR ---
app.listen(PORT, () => console.log(`Servidor modularizado corriendo en el puerto ${PORT}`));