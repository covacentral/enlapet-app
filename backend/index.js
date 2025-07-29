// backend/index.js
// Archivo principal del servidor - Versión con Corrección de CORS

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// --- Inicialización de la App ---
const app = express();
const PORT = process.env.PORT || 5001;

// --- Configuración de CORS Inteligente ---
// Lista blanca de dominios permitidos.
const whitelist = [
    'http://localhost:5173',          // Desarrollo local
    'https://www.covacentral.shop'    // Dominio de producción
];

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Si el origen de la petición está en nuestra lista blanca, lo permitimos.
    // 2. Si el origen termina en '.vercel.app', también lo permitimos (para las previews).
    // 3. Si no hay origen (ej. una petición desde Postman), también lo permitimos en desarrollo.
    if (whitelist.indexOf(origin) !== -1 || (origin && origin.endsWith('.vercel.app')) || !origin) {
      callback(null, true);
    } else {
      // Si el origen no está permitido, lo rechazamos.
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// --- Middlewares Esenciales ---
app.use(cors(corsOptions)); // <-- USAMOS LA NUEVA CONFIGURACIÓN
app.use(express.json());


// --- Importación de Rutas ---
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const petRoutes = require('./routes/pet.routes');
const postRoutes = require('./routes/post.routes');
const feedRoutes = require('./routes/feed.routes');
const notificationRoutes = require('./routes/notification.routes');
const eventRoutes = require('./routes/event.routes');
const mapRoutes = require('./routes/map.routes');
const savedRoutes = require('./routes/saved.routes');


// --- Conexión de Rutas ---
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', petRoutes);
app.use('/api', postRoutes);
app.use('/api', feedRoutes);
app.use('/api', notificationRoutes);
app.use('/api', eventRoutes);
app.use('/api', mapRoutes);
app.use('/api', savedRoutes);


// --- Ruta de Verificación de Salud ---
app.get('/', (req, res) => {
  res.send('¡API de EnlaPet funcionando correctamente!');
});


// --- Arranque del Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
