// backend/routes/pets.routes.js
// Versión 3.0: Añade validación de datos para la creación y actualización de mascotas.

const { Router } = require('express');
const multer = require('multer');

// --- 1. Importamos middleware y esquemas ---
const validateRequest = require('../middleware/validateRequest');
const { createPetSchema, updatePetSchema } = require('../models/pet.model');

const {
    getMyPets,
    createPet,
    updatePet,
    uploadPetPicture,
    managePatientLink,
    manageRescueMode,
    getCompletedMissions
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
// --- 2. Aplicamos el middleware de validación para la creación ---
router.post('/pets', validateRequest(createPetSchema), createPet);

// URL: /api/pets/:petId
// Método: PUT
// --- 3. Aplicamos el middleware de validación para la actualización ---
router.put('/pets/:petId', validateRequest(updatePetSchema), updatePet);

// URL: /api/pets/:petId/picture
// Método: POST
router.post('/pets/:petId/picture', upload.single('petPicture'), uploadPetPicture);

// URL: /api/pets/:petId/manage-link
// Método: POST
router.post('/pets/:petId/manage-link', managePatientLink);

// URL: /api/pets/:petId/rescue-mode
// Método: POST
router.post('/pets/:petId/rescue-mode', manageRescueMode);

// URL: /api/pets/:petId/completed-missions
// Método: GET
router.get('/pets/:petId/completed-missions', getCompletedMissions);


module.exports = router;