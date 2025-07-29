// backend/routes/pet.routes.js

const express = require('express');
const router = express.Router();
const {
  getUserPets,
  createPet,
  updatePet,
  getPublicPetProfile
} = require('../controllers/pet.controller'); // Importaremos los controladores de mascotas
const { protect } = require('../middlewares/auth.middleware'); // Reutilizamos nuestro guardián

// --- Definición de Rutas de Mascotas ---

// Ruta para obtener TODAS las mascotas del usuario autenticado (Ruta Privada)
// GET /api/pets
// Esta es la ruta que probablemente está fallando y causando la pantalla blanca.
router.get('/pets', protect, getUserPets);

// Ruta para crear una nueva mascota (Ruta Privada)
// POST /api/pets
router.post('/pets', protect, createPet);

// Ruta para actualizar una mascota existente (Ruta Privada)
// PUT /api/pets/:petId
router.put('/pets/:petId', protect, updatePet);

// Ruta para obtener el perfil público de una mascota (para el NFC) (Ruta Pública)
// GET /api/public/pets/:petId
// No requiere protección porque debe ser accesible para cualquiera que escanee el collar.
router.get('/public/pets/:petId', getPublicPetProfile);

module.exports = router;
