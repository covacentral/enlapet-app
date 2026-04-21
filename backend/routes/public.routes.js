// backend/routes/public.routes.js
// VERSIÓN 2.0: Reordena las rutas de rescate para evitar conflictos y soportar paginación.

const { Router } = require('express');

const {
    getPetPublicProfile,
    getUserPublicProfile,
    getRescuePetProfileByEpid,
    getActiveRescuePets
} = require('../controllers/public.controller');

const { getActiveProducts, getProductById } = require('../controllers/product.controller');
const { getCache } = require('../middleware/cache'); // Importar el middleware de caché

const router = Router();

// --- Rutas de Perfiles Públicos ---
router.get('/public/pets/:petId', getPetPublicProfile);
router.get('/public/users/:userId', getUserPublicProfile);

// --- Rutas de Rescate Públicas (ORDEN CORREGIDO) ---

// 1. La ruta específica '/all' para la lista paginada debe ir PRIMERO.
// Aplicamos Caché porque esta lista global puede ser muy solicitada.
router.get('/public/rescue/all', getCache, getActiveRescuePets);

// 2. La ruta con el parámetro dinámico '/:epid' va DESPUÉS.
//    Así, Express no confunde "all" con un EPID.
router.get('/public/rescue/:epid', getRescuePetProfileByEpid);


// --- Rutas de Productos Públicas ---
// Aplicamos Caché a los productos públicos generales
router.get('/public/products', getCache, getActiveProducts);
router.get('/public/products/:productId', getProductById);


module.exports = router;