// backend/controllers/auth.controller.js
// Lógica de negocio para el registro y la autenticación.

const { db, auth } = require('../config/firebase');
const { getNewUserProfile } = require('../models/user.model'); // <-- 1. IMPORTAMOS el nuevo modelo de usuario

/**
 * Registra un nuevo usuario con email y contraseña.
 */
const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
    }

    // 1. Crear el usuario en Firebase Authentication.
    const userRecord = await auth.createUser({ email, password, displayName: name });

    // 2. Crear el documento de perfil del usuario en Firestore usando el modelo.
    // <-- 2. UTILIZAMOS el modelo para generar la estructura de datos
    const newUserProfile = getNewUserProfile(name, email);
    await db.collection('users').doc(userRecord.uid).set(newUserProfile);

    res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });
  } catch (error) {
    console.error('Error en registerUser:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    }
    if (error.code === 'auth/invalid-password') {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    res.status(500).json({ message: 'Error al registrar el usuario.' });
  }
};

/**
 * Maneja el registro o inicio de sesión a través de Google.
 */
const googleAuth = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: 'Se requiere el idToken de Google.' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, name, email, picture } = decodedToken;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    // 1. Si el usuario no existe en Firestore, lo creamos usando el modelo.
    if (!userDoc.exists) {
      // <-- 3. UTILIZAMOS el modelo también para el registro con Google
      const newUserProfile = getNewUserProfile(name, email, picture || '');
      await userRef.set(newUserProfile);
      return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });
    } else {
      // 2. Si ya existe, simplemente confirmamos la autenticación.
      return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });
    }
  } catch (error) {
    console.error('Error en googleAuth:', error);
    res.status(500).json({ message: 'Error en la autenticación con Google.' });
  }
};

module.exports = {
  registerUser,
  googleAuth
};