// backend/index.js
// Archivo principal del servidor - Refactorizado

require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const express = require('express');
const cors = require('cors');

// --- Inicialización de la App ---
const app = express();
const PORT = process.env.PORT || 5001; // Usa el puerto de Render o 5001 en local

// --- Middlewares Esenciales ---
// Habilita CORS para permitir peticiones desde tu frontend en Vercel.
app.use(cors({
  origin: ['http://localhost:5173', 'https://www.covacentral.shop'], // Añade aquí tus dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Permite que Express pueda entender peticiones con cuerpo en formato JSON.
app.use(express.json());


// --- Importación de Rutas ---
// Importamos los archivos de rutas que hemos creado.
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const petRoutes = require('./routes/pet.routes'); // <-- NUEVA LÍNEA
const feedRoutes = require('./routes/feed.routes');


// --- Conexión de Rutas ---
// Le decimos a Express que use nuestros archivos de rutas.
// Todas las rutas definidas en estos archivos estarán prefijadas con '/api'.
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', petRoutes); // <-- NUEVA LÍNEA
app.use('/api', feedRoutes);


// --- Ruta de Verificación de Salud ---
// Es una buena práctica tener un endpoint simple para verificar que el servidor está vivo.
app.get('/', (req, res) => {
  res.send('¡API de EnlaPet funcionando!');
});


// --- Arranque del Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
