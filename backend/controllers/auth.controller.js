// backend/controllers/auth.controller.js

const { db, auth } = require('../config/firebase');

// --- Controlador para registrar un nuevo usuario con correo/contraseña ---
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Validación básica de entrada
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Por favor, proporciona nombre, email y contraseña.' });
  }

  try {
    // 1. Crear el usuario en el servicio de Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // 2. Crear el documento correspondiente en la colección 'users' de Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    
    // Definimos la estructura inicial del documento del nuevo usuario
    await userDocRef.set({
      name: name,
      email: email,
      createdAt: new Date().toISOString(),
      userType: 'personal',
      profilePictureUrl: null,
      coverPhotoUrl: null,
      bio: '',
      location: {
        city: null,
        country: 'Colombia'
      },
      privacySettings: {
        showEmail: false,
        showPhone: false,
      }
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente.', uid: userRecord.uid });

  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    // Manejar errores comunes de Firebase
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    }
    res.status(500).json({ message: 'Error del servidor al registrar el usuario.' });
  }
};


// --- Controlador para autenticar/registrar con Google ---
const authWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'No se proporcionó un token de ID de Google.' });
  }

  try {
    // 1. Verificar el token de ID de Google
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, name, email, picture } = decodedToken;

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    // 2. Si el usuario no existe en Firestore, crearlo.
    if (!userDoc.exists) {
      await userDocRef.set({
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
        userType: 'personal',
        profilePictureUrl: picture || null, // Usamos la foto de perfil de Google
        coverPhotoUrl: null,
        bio: '',
        location: {
          city: null,
          country: 'Colombia'
        },
        privacySettings: {
          showEmail: false,
          showPhone: false,
        }
      });
      return res.status(201).json({ message: 'Usuario de Google registrado exitosamente.', uid });
    }
    
    // Si el usuario ya existe, simplemente confirmamos el éxito.
    res.status(200).json({ message: 'Usuario de Google autenticado exitosamente.', uid });

  } catch (error) {
    console.error('Error en la autenticación con Google:', error);
    res.status(500).json({ message: 'Error del servidor durante la autenticación con Google.' });
  }
};


module.exports = {
  registerUser,
  authWithGoogle,
};
