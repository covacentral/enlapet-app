const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const authenticateUser = require('../middleware/authenticateUser');

// --- Rutas de Búsqueda ---
// Requieren autenticación para evitar abusos externos, pero no requieren Rate Limiting estricto ya que son de baja lectura.

router.get('/users', authenticateUser, searchController.searchUsersAndVets);
router.get('/pets', authenticateUser, searchController.searchPets);

module.exports = router;
