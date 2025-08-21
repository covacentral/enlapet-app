// backend/routes/public.routes.js
// VERSIÓN CORREGIDA: Reordena las rutas de rescate para evitar conflictos.

const { Router } = require('express');

const {
    getPetPublicProfile,
    getUserPublicProfile,
    getRescuePetProfileByEpid,
    getActiveRescuePets
} = require('../controllers/public.controller');

const { getActiveProducts, getProductById } = require('../controllers/product.controller');

const router = Router();

// --- Rutas de Perfiles Públicos ---
router.get('/public/pets/:petId', getPetPublicProfile);
router.get('/public/users/:userId', getUserPublicProfile);

// --- Rutas de Rescate Públicas (ORDEN CORREGIDO) ---

// 1. La ruta específica '/all' debe ir PRIMERO.
router.get('/public/rescue/all', getActiveRescuePets);

// 2. La ruta con el parámetro dinámico '/:epid' va DESPUÉS.
router.get('/public/rescue/:epid', getRescuePetProfileByEpid);


// --- Rutas de Productos Públicas ---
router.get('/public/products', getActiveProducts);
router.get('/public/products/:productId', getProductById);


module.exports = router;