// backend/services/auth.service.js
// Contiene la lógica de negocio para la autenticación de usuarios.
// VERSIÓN 2.0: Lógica migrada desde el controlador.

const { db, auth } = require('../config/firebase');
const { getNewUserProfile } = require('../models/user.model');

/**
 * Registra un nuevo usuario en Firestore si no existe.
 * Usado tanto para registro con email/pass como para autenticación social (Google).
 * @param {string} uid - El UID del usuario de Firebase Authentication.
 * @param {string} name - El nombre del usuario.
 * @param {string} email - El email del usuario.
 * @param {string} [profilePictureUrl] - La URL de la foto de perfil (opcional).
 * @returns {Promise<{isNewUser: boolean, uid: string}>} Un objeto indicando si el usuario es nuevo y su UID.
 */
const findOrCreateUser = async (uid, name, email, profilePictureUrl = '') => {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const newUserProfile = getNewUserProfile(name, email, profilePictureUrl);
    await userRef.set(newUserProfile);
    return { isNewUser: true, uid };
  }
  
  return { isNewUser: false, uid };
};

module.exports = {
  findOrCreateUser,
};