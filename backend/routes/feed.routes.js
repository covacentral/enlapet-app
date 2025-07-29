// backend/routes/feed.routes.js

const express = require('express');
const router = express.Router();
const { getFeed } = require('../controllers/feed.controller'); // Importaremos el controlador del feed
const { protect } = require('../middlewares/auth.middleware'); // Usamos el mismo guardián

// --- Definición de la Ruta del Feed ---

// GET /api/feed
// Esta es una ruta protegida. Un usuario debe estar autenticado para ver el feed.
// El middleware 'protect' se asegura de ello y nos da acceso a `req.user`.
router.get('/feed', protect, getFeed);

module.exports = router;
