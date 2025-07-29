// backend/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const { registerUser, authWithGoogle } = require('../controllers/auth.controller'); // Importaremos los controladores que crearemos a continuación

// --- Definición de Rutas de Autenticación ---

// Ruta para registrar un nuevo usuario con correo y contraseña
// POST /api/auth/register
router.post('/auth/register', registerUser);

// Ruta para registrar o iniciar sesión con una cuenta de Google
// POST /api/auth/google
router.post('/auth/google', authWithGoogle);

module.exports = router;
