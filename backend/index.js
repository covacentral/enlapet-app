// backend/index.js

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');

// -----------------------------------------------------------------------------
// Firebase Admin SDK Initialization
// -----------------------------------------------------------------------------
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!serviceAccountBase64) {
  console.error('ERROR FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
  process.exit(1);
}

const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
const serviceAccount = JSON.parse(serviceAccountString);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'enlapet.firebasestorage.app'
  });
  console.log('Firebase Admin SDK inicializado correctamente desde variable de entorno.');
} catch (error) {
  console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

// -----------------------------------------------------------------------------
// Express App Setup
// -----------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = new RegExp(
  /^https?:\/\/((www\.)?covacentral\.shop|localhost:5173|enlapet-app(-[a-z0-9-]+)?\.vercel\.app)$/
);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.test(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS: Origen denegado -> ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// -----------------------------------------------------------------------------
// Middleware de Autenticación
// -----------------------------------------------------------------------------
const authenticateUser = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ message: 'No autenticado. Se requiere token.' });
  }
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error de autenticación de token:', error);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};


// -----------------------------------------------------------------------------
// Endpoints Públicos
// -----------------------------------------------------------------------------
app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v2.4 Pet Profiles' }));

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
    }
    const userRecord = await auth.createUser({ email, password, displayName: name });
    const newUser = {
      name, email, createdAt: new Date().toISOString(), userType: 'personal',
      profilePictureUrl: '', coverPhotoUrl: '', bio: '',
      location: { country: 'Colombia', department: '', city: '' },
      privacySettings: { profileVisibility: 'public', showEmail: 'private' }
    };
    await db.collection('users').doc(userRecord.uid).set(newUser);
    res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });
  } catch (error) {
    console.error('Error en /api/register:', error);
    if (error.code === 'auth/email-already-exists') return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    if (error.code === 'auth/invalid-password') return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    res.status(500).json({ message: 'Error al registrar el usuario.' });
  }
});

app.post('/api/auth/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Se requiere el idToken de Google.' });
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, name, email, picture } = decodedToken;
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            const newUser = {
                name, email, createdAt: new Date().toISOString(), userType: 'personal',
                profilePictureUrl: picture || '', coverPhotoUrl: '', bio: '',
                location: { country: 'Colombia', department: '', city: '' },
                privacySettings: { profileVisibility: 'public', showEmail: 'private' }
            };
            await userRef.set(newUser);
            return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });
        } else {
            return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });
        }
    } catch (error) {
        console.error('Error en /api/auth/google:', error);
        res.status(500).json({ message: 'Error en la autenticación con Google.' });
    }
});

app.get('/api/public/pets/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const petDoc = await db.collection('pets').doc(petId).get();
    if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });
    const petData = petDoc.data();
    const userDoc = await db.collection('users').doc(petData.ownerId).get();
    let ownerPublicData = { name: 'Responsable', profilePictureUrl: '' };
    if (userDoc.exists) {
        const ownerData = userDoc.data();
        ownerPublicData = { name: ownerData.name, profilePictureUrl: ownerData.profilePictureUrl || '' };
    }
    const publicProfile = {
      pet: { name: petData.name, breed: petData.breed, petPictureUrl: petData.petPictureUrl },
      owner: ownerPublicData
    };
    res.status(200).json(publicProfile);
  } catch (error) {
    console.error('Error en /api/public/pets/:petId:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// -----------------------------------------------------------------------------
// Endpoints Privados (Requieren Autenticación)
// -----------------------------------------------------------------------------
app.use(authenticateUser);

// --- Endpoints de USUARIOS ---
app.get('/api/profile', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'Perfil no encontrado.' });
    res.status(200).json(userDoc.data());
  } catch (error) {
    console.error('Error en /api/profile (GET):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, bio, location } = req.body;
    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (bio !== undefined) updatedData.bio = bio;
    if (location !== undefined) updatedData.location = location;
    if (Object.keys(updatedData).length === 0) return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
    await db.collection('users').doc(uid).set(updatedData, { merge: true });
    res.status(200).json({ message: 'Perfil actualizado con éxito.' });
  } catch (error) {
    console.error('Error en /api/profile (PUT):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/profile/picture', upload.single('profilePicture'), async (req, res) => {
  // (Este endpoint se mantiene sin cambios)
  try {
    const { uid } = req.user;
    if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });
    const filePath = `profile-pictures/${uid}/${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });
    blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida del archivo.' }));
    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        await db.collection('users').doc(uid).set({ profilePictureUrl: publicUrl }, { merge: true });
        res.status(200).json({ message: 'Foto actualizada.', profilePictureUrl: publicUrl });
      } catch (error) {
        res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });
      }
    });
    blobStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- Endpoints de MASCOTAS ---

// [MODIFICADO] Registro de Mascota - Tarea 1.4
app.post('/api/pets', async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, breed } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });
    
    // Nueva estructura completa para la mascota
    const petData = { 
        ownerId: uid, 
        name, 
        breed: breed || '',
        createdAt: new Date().toISOString(), 
        petPictureUrl: '',
        location: {
            country: 'Colombia',
            department: '',
            city: ''
        },
        healthRecord: {
            birthDate: '',
            gender: '',
        }
    };
    const petRef = await db.collection('pets').add(petData);
    res.status(201).json({ message: 'Mascota registrada.', petId: petRef.id });
  } catch (error) {
    console.error('Error en /api/pets (POST):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.get('/api/pets', async (req, res) => {
  try {
    const { uid } = req.user;
    const petsSnapshot = await db.collection('pets').where('ownerId', '==', uid).get();
    const petsList = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(petsList);
  } catch (error) {
    console.error('Error en /api/pets (GET):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// [MODIFICADO] Actualización de Mascota y Lógica de Ubicación Implícita - Tarea 1.5
app.put('/api/pets/:petId', async (req, res) => {
  try {
    const { uid } = req.user;
    const { petId } = req.params;
    const updateData = req.body; // Recibimos todos los datos a actualizar

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
    }
    
    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });
    if (petDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });

    // Usamos set con merge para actualizar campos anidados de forma segura
    await petRef.set(updateData, { merge: true });

    // --- Lógica de Ubicación Implícita ---
    if (updateData.location && updateData.location.city) {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            // Si el usuario no tiene una ciudad, se la asignamos
            if (!userData.location || !userData.location.city) {
                await userRef.set({ location: updateData.location }, { merge: true });
                console.log(`Ubicación implícita actualizada para el usuario ${uid} a ${updateData.location.city}`);
            }
        }
    }

    res.status(200).json({ message: 'Mascota actualizada con éxito.' });
  } catch (error) {
    console.error('Error en /api/pets/:petId (PUT):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// [NUEVO] Endpoints dedicados para la Hoja de Vida
app.get('/api/pets/:petId/health-record', async (req, res) => {
    try {
        const { uid } = req.user;
        const { petId } = req.params;
        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();

        if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });
        if (petDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado.' });

        res.status(200).json(petDoc.data().healthRecord || {});
    } catch (error) {
        console.error('Error en /api/pets/:petId/health-record (GET):', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.put('/api/pets/:petId/health-record', async (req, res) => {
    try {
        const { uid } = req.user;
        const { petId } = req.params;
        const healthRecordData = req.body;

        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();

        if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });
        if (petDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado.' });
        
        // Actualizamos solo el campo healthRecord
        await petRef.set({ healthRecord: healthRecordData }, { merge: true });

        res.status(200).json({ message: 'Hoja de vida actualizada con éxito.' });
    } catch (error) {
        console.error('Error en /api/pets/:petId/health-record (PUT):', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


app.post('/api/pets/:petId/picture', upload.single('petPicture'), async (req, res) => {
  // (Este endpoint se mantiene sin cambios)
  try {
    const { uid } = req.user;
    if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });
    const { petId } = req.params;
    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();
    if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });
    if (petDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado.' });
    const filePath = `pets-pictures/${petId}/${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });
    blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida del archivo.' }));
    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        await petRef.update({ petPictureUrl: publicUrl });
        res.status(200).json({ message: 'Foto de mascota actualizada.', petPictureUrl: publicUrl });
      } catch (error) {
        res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });
      }
    });
    blobStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// -----------------------------------------------------------------------------
// Server Initialization
// -----------------------------------------------------------------------------
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
