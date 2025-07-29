// backend/controllers/saved.controller.js

const { db, admin } = require('../config/firebase');

// --- Controlador para obtener las publicaciones guardadas por el usuario ---
const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.uid;

    // 1. Obtener los IDs de los posts guardados por el usuario.
    const savedPostsSnapshot = await db.collection('users').doc(userId).collection('saved_posts').get();
    
    if (savedPostsSnapshot.empty) {
      return res.status(200).json([]); // Devolver un array vacío si no hay posts guardados.
    }

    const postIds = savedPostsSnapshot.docs.map(doc => doc.id);

    // 2. Obtener los documentos completos de los posts usando los IDs.
    // Firestore permite hasta 30 elementos en una cláusula 'in'. Si se esperan más, se necesitará paginación.
    const postsSnapshot = await db.collection('posts').where(admin.firestore.FieldPath.documentId(), 'in', postIds).get();

    const savedPosts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(savedPosts);
  } catch (error) {
    console.error('Error al obtener las publicaciones guardadas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener las publicaciones guardadas.' });
  }
};

// --- Controlador para guardar una publicación ---
const savePost = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { postId } = req.params;

    // Simplemente creamos un documento en la subcolección 'saved_posts' del usuario.
    // El ID del documento será el ID del post, para evitar duplicados y facilitar la búsqueda.
    await db.collection('users').doc(userId).collection('saved_posts').doc(postId).set({
      savedAt: new Date().toISOString()
    });

    res.status(200).json({ message: 'Publicación guardada exitosamente.' });
  } catch (error) {
    console.error('Error al guardar la publicación:', error);
    res.status(500).json({ message: 'Error del servidor al guardar la publicación.' });
  }
};

// --- Controlador para quitar una publicación de guardados ---
const unsavePost = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { postId } = req.params;

    // Eliminamos el documento correspondiente de la subcolección.
    await db.collection('users').doc(userId).collection('saved_posts').doc(postId).delete();

    res.status(200).json({ message: 'Publicación eliminada de guardados.' });
  } catch (error) {
    console.error('Error al quitar la publicación guardada:', error);
    res.status(500).json({ message: 'Error del servidor al quitar la publicación.' });
  }
};

module.exports = {
  getSavedPosts,
  savePost,
  unsavePost,
};
