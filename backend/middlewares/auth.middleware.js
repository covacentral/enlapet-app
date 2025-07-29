// backend/middlewares/auth.middleware.js

const { auth } = require('../config/firebase');

// Este es nuestro middleware de autenticación.
// Protegerá las rutas que requieran que un usuario esté logueado.
const protect = async (req, res, next) => {
  let token;

  // Verificamos si la cabecera 'Authorization' existe y empieza con "Bearer".
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Extraemos el token de la cabecera (ej: "Bearer <token>").
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificamos el token usando el SDK de Firebase Admin.
      // Si el token es inválido o ha expirado, esto lanzará un error.
      const decodedToken = await auth.verifyIdToken(token);

      // 3. Si el token es válido, añadimos la información del usuario (payload)
      // al objeto `req` de la petición. De esta forma, las siguientes funciones
      // (los controladores) sabrán quién está haciendo la petición.
      req.user = decodedToken;

      // 4. Continuamos con la siguiente función en la cadena (el controlador de la ruta).
      next();
    } catch (error) {
      console.error('Error al verificar el token de autenticación:', error);
      res.status(401).json({ message: 'No autorizado, el token falló.' });
    }
  }

  // Si no hay token en la cabecera, rechazamos la petición.
  if (!token) {
    res.status(401).json({ message: 'No autorizado, no se proporcionó un token.' });
  }
};

module.exports = { protect };
