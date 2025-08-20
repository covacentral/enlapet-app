// backend/routes/public.routes.js
// Define exclusivamente los endpoints públicos de la API.
// VERSIÓN ACTUALIZADA: Centraliza los controladores públicos y añade la ruta de rescate.

const { Router } = require('express');

// 1. Importamos las funciones desde el nuevo controlador público centralizado.
const {
    getPetPublicProfile,
    getUserPublicProfile,
    getRescuePetProfileByEpid
} = require('../controllers/public.controller');

// La importación del controlador de productos se mantiene, ya que es pública.
const { getActiveProducts, getProductById } = require('../controllers/product.controller');


const router = Router();

// --- Rutas de Perfiles Públicos ---
router.get('/public/pets/:petId', getPetPublicProfile);
router.get('/public/users/:userId', getUserPublicProfile);

// --- [NUEVA RUTA] Ruta de Rescate Pública ---
// URL: /api/public/rescue/:epid
// Método: GET
// Función: Obtiene el perfil de búsqueda de una mascota por su EPID.
router.get('/public/rescue/:epid', getRescuePetProfileByEpid);


// --- Rutas de Productos Públicas ---
router.get('/public/products', getActiveProducts);
router.get('/public/products/:productId', getProductById);


module.exports = router;