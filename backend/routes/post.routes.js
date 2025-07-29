// backend/routes/post.routes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createPost,
  likePost,
  unlikePost,
  addComment,
  getComments,
  followProfile,
  unfollowProfile,
  getPostsByUser // <-- Importamos la nueva función
} = require('../controllers/post.controller'); // Importaremos los controladores de posts
const { protect } = require('../middlewares/auth.middleware');

// --- Configuración de Multer para la subida de imágenes ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Definición de Rutas de Publicaciones e Interacciones ---

// Ruta para crear una nueva publicación (incluye subida de imagen)
// POST /api/posts
router.post('/posts', protect, upload.single('image'), createPost);

// Ruta para obtener todos los posts de un usuario específico
// GET /api/posts/user/:userId
router.get('/posts/user/:userId', getPostsByUser); // <-- NUEVA RUTA

// Ruta para dar "like" a una publicación
// POST /api/posts/:postId/like
router.post('/posts/:postId/like', protect, likePost);

// Ruta para quitar el "like" de una publicación
// DELETE /api/posts/:postId/like
router.delete('/posts/:postId/like', protect, unlikePost);

// Ruta para añadir un comentario a una publicación
// POST /api/posts/:postId/comment
router.post('/posts/:postId/comment', protect, addComment);

// Ruta para obtener todos los comentarios de una publicación
// GET /api/posts/:postId/comments
router.get('/posts/:postId/comments', protect, getComments);

// Ruta para seguir a un perfil (usuario o mascota)
// POST /api/profiles/:profileId/follow
router.post('/profiles/:profileId/follow', protect, followProfile);

// Ruta para dejar de seguir a un perfil
// DELETE /api/profiles/:profileId/follow
router.delete('/profiles/:profileId/follow', protect, unfollowProfile);

module.exports = router;
