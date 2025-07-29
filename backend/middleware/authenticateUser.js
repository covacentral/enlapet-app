// backend/middleware/authenticateUser.js
// Middleware para verificar el token de Firebase y proteger las rutas.

const { auth } = require('../config/firebase'); // Importamos solo 'auth' desde nuestra nueva configuración.

const authenticateUser = async (req, res, next) => {
  // 1. Extraer el token del header 'Authorization'.
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    // Si no hay token, se responde con un error de no autenticado.
    return res.status(401).json({ message: 'No autenticado. Se requiere un token.' });
  }

  try {
    // 2. Verificar el token usando el SDK de Firebase.
    // Si el token es válido, decodifica la información del usuario.
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // 3. Adjuntar la información del usuario al objeto 'req'.
    // Esto hace que los datos del usuario (como el UID) estén disponibles en los controladores.
    req.user = decodedToken;
    
    // 4. Continuar con la siguiente función en la cadena (el controlador de la ruta).
    next();
  } catch (error) {
    // Si el token es inválido o ha expirado, se captura el error.
    console.error('Error de autenticación de token:', error);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = authenticateUser;