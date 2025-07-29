// backend/routes/profile.routes.js
// Define los endpoints para la gestión de perfiles de usuario y seguimiento.

const { Router } = require('express');
const multer = require('multer');
const { 
    getUserPublicProfile,
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

// --- Rutas Públicas (No requieren token de autenticación) ---

// URL: /api/public/users/:userId
// Método: GET
// Función: Obtiene el perfil público de cualquier usuario.
router.get('/public/users/:userId', getUserPublicProfile);


// --- Rutas Protegidas (Requieren token de autenticación) ---
// El middleware de autenticación se aplicará a este grupo de rutas en el index.js principal.

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