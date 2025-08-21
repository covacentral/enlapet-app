// backend/routes/public.routes.js
// Define exclusivamente los endpoints públicos de la API.
// VERSIÓN ACTUALIZADA: Centraliza los controladores públicos y añade la ruta de rescate.

const { Router } = require('express');

// 1. Importamos las funciones desde el nuevo controlador público centralizado.
const {
    getPetPublicProfile,
    getUserPublicProfile,
    getRescuePetProfileByEpid,
    getActiveRescuePets // <-- Se añade la nueva función
} = require('../controllers/public.controller');

// La importación del controlador de productos se mantiene, ya que es pública.
const { getActiveProducts, getProductById } = require('../controllers/product.controller');


const router = Router();

// --- Rutas de Perfiles Públicos ---
router.get('/public/pets/:petId', getPetPublicProfile);
router.get('/public/users/:userId', getUserPublicProfile);

// --- Rutas de Rescate Públicas ---

// Obtiene el perfil de búsqueda de una mascota por su EPID.
router.get('/public/rescue/:epid', getRescuePetProfileByEpid);

// [NUEVA RUTA] Obtiene la lista de todas las mascotas en búsqueda activa.
router.get('/public/rescue/all', getActiveRescuePets);


// --- Rutas de Productos Públicas ---
router.get('/public/products', getActiveProducts);
router.get('/public/products/:productId', getProductById);


module.exports = router;