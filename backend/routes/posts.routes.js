// backend/routes/posts.routes.js
// VERSIÓN 3.1: CORREGIDO. Reordena las rutas para resolver conflictos de enrutamiento.

const { Router } = require('express');
const multer = require('multer');

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
router.post('/posts', upload.single('postImage'), validateRequest(createPostSchema), createPost);
router.get('/posts/by-author/:authorId', getPostsByAuthor);

// --- Rutas de Estados (Like y Guardado) ---
router.post('/posts/like-statuses', getLikeStatuses);
router.post('/posts/save-statuses', getSaveStatuses);


// --- [CORRECCIÓN] ---
// Las rutas más específicas deben ir ANTES de las rutas más genéricas para que Express las capture correctamente.
// Se añade el prefijo /posts que faltaba.

// --- Rutas de Interacción con Posts Específicos ---
router.post('/posts/:postId/like', likePost);
router.delete('/posts/:postId/unlike', unlikePost);
router.post('/posts/:postId/comments', addComment);
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/save', savePost);
router.delete('/posts/:postId/save', unsavePost);

// --- Ruta Genérica para un Post Específico ---
// Esta es la ruta más genérica, por lo que debe ir al final.
router.get('/posts/:postId', getPostById);


module.exports = router;