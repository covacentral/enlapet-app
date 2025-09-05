// backend/controllers/auth.controller.js
// VERSIÓN 3.0: CORREGIDO. Unifica la lógica de registro para que se base en la verificación de tokens.

const { db, auth } = require('../config/firebase');
const { getNewUserProfile } = require('../models/user.model');

/**
 * Registra un nuevo usuario en Firestore a partir de un token de email/contraseña.
 */
const registerUser = async (req, res) => {
  // 1. Ahora esperamos un idToken en lugar de email/password.
  const { idToken, name } = req.body;
  if (!idToken || !name) {
    return res.status(400).json({ message: 'Se requiere un token y un nombre.' });
  }

  try {
    // 2. Verificamos el token para obtener el UID y el email de forma segura.
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // 3. Verificamos si el usuario ya existe en Firestore.
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        return res.status(409).json({ message: 'El usuario ya existe en la base de datos.' });
    }

    // 4. Creamos el perfil de usuario en Firestore.
    const newUserProfile = getNewUserProfile(name, email);
    await userRef.set(newUserProfile);

    res.status(201).json({ message: 'Usuario registrado con éxito', uid });
  } catch (error) {
    console.error('Error en registerUser:', error);
    res.status(500).json({ message: 'Error al registrar el usuario en la base de datos.' });
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

    // 5. Lógica de "buscar o crear" restaurada para máxima fiabilidad.
    if (!userDoc.exists) {
      const newUserProfile = getNewUserProfile(name, email, picture || '');
      await userRef.set(newUserProfile);
      return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });
    } else {
      return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });
    }
  } catch (error) {
    console.error("Error en googleAuth:", error);
    return res.status(401).json({ message: "Token de Google inválido o expirado." });
  }
};

module.exports = {
  registerUser,
  googleAuth,
};