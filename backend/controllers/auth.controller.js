// backend/controllers/auth.controller.js
// Lógica de negocio para el registro y la autenticación.
// VERSIÓN 2.0: Refactorizado para usar auth.service.js

const { auth } = require('../config/firebase');
const authService = require('../services/auth.service'); // <-- 1. IMPORTAMOS el servicio

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

    // 2. LLAMAMOS AL SERVICIO para crear el perfil en Firestore.
    // La lógica de si existe o no, y cómo se crea, está ahora en el servicio.
    await authService.findOrCreateUser(userRecord.uid, name, email);

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

    // LLAMAMOS AL SERVICIO para encontrar o crear el usuario en Firestore.
    const { isNewUser } = await authService.findOrCreateUser(uid, name, email, picture);
    
    const message = isNewUser 
      ? 'Usuario registrado y autenticado con Google.' 
      : 'Usuario autenticado con Google.';
    
    const statusCode = isNewUser ? 201 : 200;

    return res.status(statusCode).json({ message, uid });

  } catch (error) {
    console.error("Error en googleAuth:", error);
    return res.status(401).json({ message: "Token de Google inválido o expirado." });
  }
};

module.exports = {
  registerUser,
  googleAuth,
};