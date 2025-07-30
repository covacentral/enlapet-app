// backend/routes/posts.routes.js
// VERSIÓN CORREGIDA: Añade la ruta para obtener un post por ID.

const { Router } = require('express');
const multer = require('multer');
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
    getPostById // <-- 1. Importamos la nueva función
} = require('../controllers/post.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// --- Rutas del Feed y Posts Guardados ---
router.get('/feed', getFeed);
router.get('/user/saved-posts', getSavedPosts);

// --- Rutas de Posts Generales ---
router.post('/posts', upload.single('postImage'), createPost);
router.get('/posts/by-author/:authorId', getPostsByAuthor);

// --- Rutas de Estados (Like y Guardado) ---
router.post('/posts/like-statuses', getLikeStatuses);
router.post('/posts/save-statuses', getSaveStatuses);

// --- [NUEVO] Ruta para un Post Específico ---
// Debe ir antes de las rutas con /:postId/ para evitar conflictos de enrutamiento.
router.get('/posts/:postId', getPostById); // <-- 2. Añadimos la nueva ruta

// --- Rutas de Interacción con Posts Específicos ---
router.post('/posts/:postId/like', likePost);
router.delete('/posts/:postId/unlike', unlikePost);
router.post('/posts/:postId/comment', addComment);
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/save', savePost);
router.delete('/posts/:postId/unsave', unsavePost);

module.exports = router;