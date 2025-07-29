// backend/routes/pets.routes.js
// Define los endpoints PROTEGIDOS para la gestión de perfiles de mascotas.

const { Router } = require('express');
const multer = require('multer');
const {
    getMyPets,
    createPet,
    updatePet,
    uploadPetPicture
} = require('../controllers/pet.controller');

// Configuración de Multer para la subida de archivos en memoria
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// --- Rutas Protegidas (Requieren autenticación) ---

// URL: /api/pets
// Método: GET
// Función: Obtiene todas las mascotas del usuario autenticado.
router.get('/pets', getMyPets);

// URL: /api/pets
// Método: POST
// Función: Crea una nueva mascota para el usuario autenticado.
router.post('/pets', createPet);

// URL: /api/pets/:petId
// Método: PUT
// Función: Actualiza la información de una mascota específica.
router.put('/pets/:petId', updatePet);

// URL: /api/pets/:petId/picture
// Método: POST
// Función: Sube la foto de perfil para una mascota específica.
router.post('/pets/:petId/picture', upload.single('petPicture'), uploadPetPicture);

module.exports = router;