// backend/routes/locations.routes.js
// Define los endpoints para la gestión del mapa comunitario y sus lugares.

const { Router } = require('express');
const {
    getLocationCategories,
    getLocations,
    getLocationDetails,
    createLocation,
    addReviewToLocation
} = require('../controllers/location.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación.

// URL: /api/location-categories
// Método: GET
// Función: Obtiene la lista de categorías de lugares.
router.get('/location-categories', getLocationCategories);

// URL: /api/locations
// Método: GET
// Función: Obtiene la lista de lugares, con filtro opcional por categoría.
router.get('/locations', getLocations);

// URL: /api/locations/:locationId
// Método: GET
// Función: Obtiene los detalles de un lugar específico y sus reseñas.
router.get('/locations/:locationId', getLocationDetails);

// URL: /api/locations
// Método: POST
// Función: Crea un nuevo lugar en el mapa.
router.post('/locations', createLocation);

// URL: /api/locations/:locationId/review
// Método: POST
// Función: Añade una reseña a un lugar específico.
router.post('/locations/:locationId/review', addReviewToLocation);

module.exports = router;