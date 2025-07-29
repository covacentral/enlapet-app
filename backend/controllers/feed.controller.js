// backend/controllers/feed.controller.js

const { db } = require('../config/firebase');

// --- Controlador para construir y devolver el feed del usuario ---
const getFeed = async (req, res) => {
  try {
    const userId = req.user.uid;
    const allPosts = new Map(); // Usamos un Map para evitar duplicados fácilmente.

    // --- 1. Lógica del Feed Personalizado ---
    const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();
    const followingIds = followingSnapshot.docs.map(doc => doc.id);

    if (followingIds.length > 0) {
      const personalizedFeedQuery = await db.collection('posts')
        .where('authorId', 'in', followingIds)
        .orderBy('createdAt', 'desc')
        .limit(20) // Traemos los 20 más recientes de la gente que sigue
        .get();
      
      personalizedFeedQuery.docs.forEach(doc => {
        allPosts.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }

    // --- 2. Lógica del Feed de Descubrimiento ---
    // Siempre buscamos posts de descubrimiento para complementar.
    const discoveryFeedQuery = await db.collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(20) // Traemos los 20 más recientes de toda la plataforma
      .get();

    discoveryFeedQuery.docs.forEach(doc => {
      // Si el post no está ya en nuestro Map, lo añadimos.
      if (!allPosts.has(doc.id)) {
        allPosts.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });

    // --- 3. Combinar y Ordenar ---
    // Convertimos el Map de nuevo a un array y lo ordenamos por fecha.
    const finalFeed = Array.from(allPosts.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 4. Devolvemos el feed combinado.
    res.status(200).json(finalFeed);

  } catch (error) {
    console.error('Error al construir el feed combinado:', error);
    res.status(500).json({ message: 'Error del servidor al construir el feed.' });
  }
};

module.exports = {
  getFeed,
};
