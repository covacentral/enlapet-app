// backend/routes/auth.routes.js
// Define los endpoints para el registro y la autenticación.

const { Router } = require('express');
const { registerUser, googleAuth } = require('../controllers/auth.controller');

const router = Router();

// --- Rutas Públicas (no requieren autenticación) ---

// URL: /api/auth/register
// Método: POST
// Función: Registra un nuevo usuario usando email y contraseña.
router.post('/register', registerUser);

// URL: /api/auth/google
// Método: POST
// Función: Maneja el inicio de sesión o registro con una cuenta de Google.
router.post('/google', googleAuth);


module.exports = router;