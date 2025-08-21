// backend/routes/pets.routes.js
// Versión 2.4 - Añade la ruta para obtener las misiones completadas.

const { Router } = require('express');
const multer = require('multer');
const {
    getMyPets,
    createPet,
    updatePet,
    uploadPetPicture,
    managePatientLink,
    manageRescueMode,
    getCompletedMissions // <-- 1. Importamos la nueva función del controlador
} = require('../controllers/pet.controller');

// Configuración de Multer para la subida de archivos en memoria
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// --- Rutas Protegidas (Requieren autenticación) ---

// URL: /api/pets
// Método: GET
router.get('/pets', getMyPets);

// URL: /api/pets
// Método: POST
router.post('/pets', createPet);

// URL: /api/pets/:petId
// Método: PUT
router.put('/pets/:petId', updatePet);

// URL: /api/pets/:petId/picture
// Método: POST
router.post('/pets/:petId/picture', upload.single('petPicture'), uploadPetPicture);

// URL: /api/pets/:petId/manage-link
// Método: POST
router.post('/pets/:petId/manage-link', managePatientLink);

// URL: /api/pets/:petId/rescue-mode
// Método: PUT
router.put('/pets/:petId/rescue-mode', manageRescueMode);

// --- [NUEVA RUTA] ---
// URL: /api/pets/:petId/completed-missions
// Método: GET
// Función: Obtiene el historial de misiones (hitos) de una mascota.
router.get('/pets/:petId/completed-missions', getCompletedMissions);


module.exports = router;