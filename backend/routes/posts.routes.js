// backend/routes/posts.routes.js
// VERSIÓN 3.0: Añade validación de datos para la creación de posts.

const { Router } = require('express');
const multer = require('multer');

// --- 1. Importamos middleware y esquema ---
const validateRequest = require('../middleware/validateRequest');
const { createPostSchema } = require('../models/post.model');

const {
    getFeed,
    createPost,
    getPostsByAuthor,
    likePost,
    unlikePost,
    getLikeStatuses,
    addComment,
    getComments,
    savePost,
    unsavePost,
    getSaveStatuses,
    getSavedPosts,
    getPostById
} = require('../controllers/post.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// --- Rutas del Feed y Posts Guardados ---
router.get('/feed', getFeed);
router.get('/user/saved-posts', getSavedPosts);

// --- Rutas de Posts Generales ---
// --- 2. Aplicamos el middleware de validación a la creación de posts ---
router.post('/posts', upload.single('postImage'), validateRequest(createPostSchema), createPost);
router.get('/posts/by-author/:authorId', getPostsByAuthor);

// --- Rutas de Estados (Like y Guardado) ---
router.post('/posts/like-statuses', getLikeStatuses);
router.post('/posts/save-statuses', getSaveStatuses);

// --- Ruta para un Post Específico ---
router.get('/posts/:postId', getPostById);

// --- Rutas de Interacción con Posts Específicos ---
router.post('/:postId/like', likePost);
router.delete('/:postId/like', unlikePost);
router.post('/:postId/comments', addComment);
router.get('/:postId/comments', getComments);
router.post('/:postId/save', savePost);
router.delete('/:postId/save', unsavePost);

module.exports = router;