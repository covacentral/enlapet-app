// backend/controllers/user.controller.js

const { db } = require('../config/firebase');

// --- Controlador para obtener el perfil del usuario autenticado (Privado) ---
const getMyProfile = async (req, res) => {
  try {
    // El middleware 'protect' ya verificó el token y nos dio el uid en req.user.uid
    const userId = req.user.uid;
    
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Enviamos todos los datos del perfil porque el usuario es el dueño de la información.
    res.status(200).json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(500).json({ message: 'Error del servidor al obtener el perfil.' });
  }
};

// --- Controlador para actualizar el perfil del usuario (Privado) ---
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const dataToUpdate = req.body;

    const userRef = db.collection('users').doc(userId);

    // Usamos .set con { merge: true } para actualizar solo los campos enviados
    // y no sobrescribir el documento entero. Es más seguro y flexible.
    await userRef.set(dataToUpdate, { merge: true });

    res.status(200).json({ message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar el perfil del usuario:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar el perfil.' });
  }
};

// --- Controlador para obtener un perfil de usuario público ---
const getUserPublicProfile = async (req, res) => {
  try {
    // El ID del usuario a consultar viene de los parámetros de la URL (ej: /api/public/users/some-user-id)
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const userData = userDoc.data();

    // ¡PASO DE SEGURIDAD CRÍTICO!
    // Creamos un nuevo objeto solo con los campos que queremos que sean públicos.
    // Nunca enviamos el documento completo de la base de datos en una ruta pública.
    const publicProfile = {
      id: userDoc.id,
      name: userData.name,
      profilePictureUrl: userData.profilePictureUrl || null,
      coverPhotoUrl: userData.coverPhotoUrl || null,
      bio: userData.bio || '',
      userType: userData.userType || 'personal',
      // Solo mostramos la ciudad y el país, no la ubicación detallada.
      location: {
        city: userData.location?.city || null,
        country: userData.location?.country || null,
      },
      // Podríamos añadir listas de seguidores/seguidos si quisiéramos mostrarlas públicamente
    };

    res.status(200).json(publicProfile);
  } catch (error) {
    console.error('Error al obtener el perfil público:', error);
    res.status(500).json({ message: 'Error del servidor al obtener el perfil público.' });
  }
};


module.exports = {
  getMyProfile,
  updateUserProfile,
  getUserPublicProfile,
};
