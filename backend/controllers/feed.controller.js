// backend/controllers/feed.controller.js

const { db } = require('../config/firebase');

// --- Controlador para construir y devolver el feed del usuario ---
const getFeed = async (req, res) => {
  try {
    const userId = req.user.uid;

    // --- Lógica del Feed Personalizado ---

    // 1. Obtener la lista de perfiles que el usuario sigue.
    const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();
    const followingIds = followingSnapshot.docs.map(doc => doc.id);

    let posts = [];

    // 2. Si el usuario sigue al menos a una persona, buscar sus posts.
    if (followingIds.length > 0) {
      // NOTA DE ARQUITECTURA: Esta consulta requiere un índice compuesto en Firestore.
      // Colección: 'posts', Campos: 'authorId' (Ascendente), 'createdAt' (Descendente).
      const postsQuery = await db.collection('posts')
        .where('authorId', 'in', followingIds)
        .orderBy('createdAt', 'desc')
        .limit(30) // Limitamos a 30 para empezar, podemos añadir paginación después.
        .get();
      
      posts = postsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // --- Lógica del Feed de Descubrimiento ---

    // 3. Si el feed personalizado está vacío (porque no sigue a nadie o sus seguidos no han posteado),
    //    le mostramos un feed de descubrimiento.
    if (posts.length === 0) {
      // Para el descubrimiento, buscamos los 20 posts más recientes de toda la plataforma.
      // Se puede hacer más complejo en el futuro (por popularidad, ubicación, etc.).
      const discoveryQuery = await db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      posts = discoveryQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 4. Devolvemos la lista de posts (sea personalizada o de descubrimiento).
    res.status(200).json(posts);

  } catch (error) {
    console.error('Error al construir el feed:', error);
    // Este log es crucial. Si hay un error de índice en Firestore, se mostrará aquí.
    res.status(500).json({ message: 'Error del servidor al construir el feed.' });
  }
};

module.exports = {
  getFeed,
};
