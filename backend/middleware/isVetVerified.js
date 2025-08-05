// backend/middleware/isVetVerified.js
// Middleware para verificar que el usuario autenticado tiene un perfil verificado de tipo 'vet'.

const { db } = require('../config/firebase');

const isVetVerified = async (req, res, next) => {
  const { uid } = req.user;

  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({ message: 'Acceso denegado. Perfil de usuario no encontrado.' });
    }

    const userData = userDoc.data();

    // Verificamos que el objeto 'verification' exista y que el status y type sean los correctos.
    if (userData.verification?.status === 'verified' && userData.verification?.type === 'vet') {
      // Si el usuario es un veterinario verificado, continuamos con la siguiente función.
      return next();
    }

    // Si no cumple con las condiciones, se le deniega el acceso.
    return res.status(403).json({ message: 'Acceso denegado. Esta acción requiere una cuenta de veterinario verificada.' });

  } catch (error) {
    console.error('Error en el middleware isVetVerified:', error);
    return res.status(500).json({ message: 'Error interno al verificar los permisos del usuario.' });
  }
};

module.exports = isVetVerified;