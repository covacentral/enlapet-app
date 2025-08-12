// backend/routes/public.routes.js
// Define exclusivamente los endpoints públicos de la API.
// VERSIÓN ACTUALIZADA: Incluye las rutas para consultar productos de la tienda.

const { Router } = require('express');

// Importaciones de controladores existentes
const { getPetPublicProfile } = require('../controllers/pet.controller');
const { getUserPublicProfile } = require('../controllers/profile.controller');

// --- NUEVO: Importación del controlador de productos ---
const { getActiveProducts, getProductById } = require('../controllers/product.controller');


const router = Router();

// --- Rutas de Perfiles Públicos (existentes) ---
router.get('/public/pets/:petId', getPetPublicProfile);
router.get('/public/users/:userId', getUserPublicProfile);

// --- NUEVO: Rutas de Productos Públicas ---

// URL: /api/public/products
// Método: GET
// Función: Obtiene una lista de todos los productos activos en la tienda.
router.get('/public/products', getActiveProducts);

// URL: /api/public/products/:productId
// Método: GET
// Función: Obtiene los detalles de un producto específico por su ID.
router.get('/public/products/:productId', getProductById);


module.exports = router;