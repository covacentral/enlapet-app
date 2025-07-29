// backend/routes/saved.routes.js

const express = require('express');
const router = express.Router();
const {
  savePost,
  unsavePost,
  getSavedPosts
} = require('../controllers/saved.controller'); // Importaremos el controlador
const { protect } = require('../middlewares/auth.middleware');

// --- Definición de Rutas de Publicaciones Guardadas ---

// Ruta para obtener todas las publicaciones guardadas por el usuario
// GET /api/saved-posts
router.get('/saved-posts', protect, getSavedPosts);

// Ruta para guardar una publicación
// POST /api/posts/:postId/save
router.post('/posts/:postId/save', protect, savePost);

// Ruta para quitar una publicación de guardados
// DELETE /api/posts/:postId/save
router.delete('/posts/:postId/save', protect, unsavePost);

module.exports = router;
