// backend/routes/profile.routes.js
// Define los endpoints PROTEGIDOS para la gestión de perfiles de usuario y seguimiento.

const { Router } = require('express');
const multer = require('multer');
const { 
    getCurrentUserProfile,
    updateUserProfile,
    uploadProfilePicture,
    followProfile,
    unfollowProfile,
    getFollowStatus
} = require('../controllers/profile.controller');

// Configuración de Multer para la subida de archivos en memoria
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// --- Rutas Protegidas (Requieren autenticación) ---

// URL: /api/profile
// Método: GET
// Función: Obtiene el perfil completo del usuario autenticado.
router.get('/profile', getCurrentUserProfile);

// URL: /api/profile
// Método: PUT
// Función: Actualiza el perfil del usuario autenticado.
router.put('/profile', updateUserProfile);

// URL: /api/profile/picture
// Método: POST
// Función: Sube la foto de perfil del usuario autenticado.
router.post('/profile/picture', upload.single('profilePicture'), uploadProfilePicture);

// URL: /api/profiles/:profileId/follow
// Método: POST
// Función: Permite al usuario autenticado seguir un perfil.
router.post('/profiles/:profileId/follow', followProfile);

// URL: /api/profiles/:profileId/unfollow
// Método: DELETE
// Función: Permite al usuario autenticado dejar de seguir un perfil.
router.delete('/profiles/:profileId/unfollow', unfollowProfile);

// URL: /api/profiles/:profileId/follow-status
// Método: GET
// Función: Verifica si el usuario autenticado sigue a un perfil.
router.get('/profiles/:profileId/follow-status', getFollowStatus);

module.exports = router;