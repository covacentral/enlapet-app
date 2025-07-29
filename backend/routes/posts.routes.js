// backend/routes/posts.routes.js
// Define los endpoints para el feed, posts, likes, comentarios, guardados y reportes.

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
    getSavedPosts
} = require('../controllers/post.controller');
// Nota: El controlador de reportes se añadirá en una refactorización posterior para mantener el foco.

// Configuración de Multer para la subida de archivos en memoria
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación.

// --- Rutas del Feed ---
router.get('/feed', getFeed);

// --- Rutas de Publicaciones Guardadas ---
router.get('/user/saved-posts', getSavedPosts);

// --- Rutas de Posts ---
router.post('/posts', upload.single('postImage'), createPost);
router.get('/posts/by-author/:authorId', getPostsByAuthor);

// --- Rutas de Estados (Like y Guardado) ---
router.post('/posts/like-statuses', getLikeStatuses);
router.post('/posts/save-statuses', getSaveStatuses);

// --- Rutas de Interacción con Posts Específicos ---
router.post('/posts/:postId/like', likePost);
router.delete('/posts/:postId/unlike', unlikePost);
router.post('/posts/:postId/comment', addComment);
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/save', savePost);
router.delete('/posts/:postId/unsave', unsavePost);

module.exports = router;