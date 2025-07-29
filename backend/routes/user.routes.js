// backend/routes/user.routes.js

const express = require('express');
const router = express.Router();
const { getMyProfile, updateUserProfile, getUserPublicProfile } = require('../controllers/user.controller'); // Importaremos los controladores que crearemos después
const { protect } = require('../middlewares/auth.middleware'); // Importamos nuestro guardián

// --- Definición de Rutas ---

// Ruta para obtener el perfil del usuario autenticado (Ruta Privada)
// GET /api/profile
// Cuando una petición llegue a esta ruta, primero pasará por el middleware 'protect'.
// Si el token es válido, 'protect' añadirá los datos del usuario a `req.user`
// y luego pasará el control a la función `getMyProfile`.
router.get('/profile', protect, getMyProfile);

// Ruta para actualizar el perfil del usuario autenticado (Ruta Privada)
// PUT /api/profile
router.put('/profile', protect, updateUserProfile);

// Ruta para obtener el perfil público de cualquier usuario (Ruta Pública)
// GET /api/public/users/:userId
// Nota: Esta ruta no usa el middleware 'protect' porque queremos que sea
// accesible para cualquier persona, incluso sin iniciar sesión.
router.get('/public/users/:userId', getUserPublicProfile);


module.exports = router;
