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
let serviceAccount;

if (serviceAccountBase64) {
  const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
  serviceAccount = JSON.parse(serviceAccountString);
} else {
  // Fallback para desarrollo local si la variable de entorno no está
  console.log("Cargando credenciales desde archivo local serviceAccountKey.json");
  serviceAccount = require('./serviceAccountKey.json');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'enlapet.firebasestorage.app'
  });
  console.log('Firebase Admin SDK inicializado correctamente.');
} catch (error) {
  console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

const app = express();
const PORT = process.env.PORT || 3001;

// -----------------------------------------------------------------------------
// CORS Configuration (VERSIÓN FINAL CON SOPORTE PARA PREVIEWS DE VERCEL)
// -----------------------------------------------------------------------------

// Usamos una Expresión Regular (Regex) para validar los orígenes.
// Esta regla permite:
// 1. El dominio de producción.
// 2. localhost para desarrollo.
// 3. CUALQUIER subdominio de Vercel para nuestro proyecto (ej: enlapet-app-....vercel.app)
const allowedOrigins = new RegExp(
  /^https?:\/\/((www\.)?covacentral\.shop|localhost:5173|enlapet-app(-[a-z0-9-]+)?\.vercel\.app)$/
);

const corsOptions = {
  origin: function (origin, callback) {
    // Si no hay origen (como en Postman) o si el origen coincide con nuestra regla, se permite.
    if (!origin || allowedOrigins.test(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS: Origen denegado -> ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Habilita las pre-flight requests (peticiones OPTIONS) para TODAS las rutas.
app.options('*', cors(corsOptions)); 

// Aplica la configuración de CORS para todas las demás peticiones.
app.use(cors(corsOptions));


// Middleware para parsear JSON
app.use(express.json());

// Configuración de Multer para la subida de archivos
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });


// -----------------------------------------------------------------------------
// ENDPOINTS DE LA APLICACIÓN (Sin cambios aquí)
// -----------------------------------------------------------------------------

app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v2.1 Estable' }));

// ... (El resto de tus endpoints: /api/register, /api/profile, /api/pets, etc. se mantienen exactamente igual que en tu archivo)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const userRecord = await auth.createUser({ email, password, displayName: name });
    await db.collection('users').doc(userRecord.uid).set({
      name, email, createdAt: new Date().toISOString(), bio: '', profilePictureUrl: '', phone: ''
    });
    res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });
  } catch (error) {
    console.error('Error en /api/register:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
    const decodedToken = await auth.verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'Perfil no encontrado.' });
    res.status(200).json(userDoc.data());
  } catch (error) {
    console.error('Error en /api/profile (GET):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
    const decodedToken = await auth.verifyIdToken(idToken);
    const { name, phone, bio } = req.body;
    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (phone !== undefined) updatedData.phone = phone;
    if (bio !== undefined) updatedData.bio = bio;
    await db.collection('users').doc(decodedToken.uid).set(updatedData, { merge: true });
    res.status(200).json({ message: 'Perfil actualizado con éxito.' });
  } catch (error) {
    console.error('Error en /api/profile (PUT):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/profile/picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
    const decodedToken = await auth.verifyIdToken(idToken);
    if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });

    const filePath = `profile-pictures/${decodedToken.uid}/${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({
      metadata: { contentType: req.file.mimetype },
    });

    blobStream.on('error', (error) => { 
        console.error("Error en blobStream:", error);
        res.status(500).json({ message: 'Error durante la subida del archivo.' });
    });

    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        await db.collection('users').doc(decodedToken.uid).set({ profilePictureUrl: publicUrl }, { merge: true });
        res.status(200).json({ message: 'Foto actualizada.', profilePictureUrl: publicUrl });
      } catch (error) {
        console.error("Error al hacer público el archivo o al guardar en DB:", error);
        res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });
      }
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error('Error en /api/profile/picture:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/pets', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
    const decodedToken = await auth.verifyIdToken(idToken);
    const { name, breed } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });
    const petData = { 
        ownerId: decodedToken.uid, 
        name, 
        breed: breed || '',
        createdAt: new Date().toISOString(), 
        petPictureUrl: '' 
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
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
    const decodedToken = await auth.verifyIdToken(idToken);
    const petsSnapshot = await db.collection('pets').where('ownerId', '==', decodedToken.uid).get();
    const petsList = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(petsList);
  } catch (error) {
    console.error('Error en /api/pets (GET):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.put('/api/pets/:petId', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
    const decodedToken = await auth.verifyIdToken(idToken);

    const { name, breed } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });
    
    const { petId } = req.params;
    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) {
      return res.status(404).json({ message: 'Mascota no encontrada.' });
    }
    if (petDoc.data().ownerId !== decodedToken.uid) {
      return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });
    }

    await petRef.update({ name, breed: breed || '' });
    res.status(200).json({ message: 'Mascota actualizada con éxito.' });

  } catch (error) {
    console.error('Error en /api/pets/:petId (PUT):', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/pets/:petId/picture', upload.single('petPicture'), async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });

    const { petId } = req.params;
    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) {
      return res.status(404).json({ message: 'Mascota no encontrada.' });
    }
    if (petDoc.data().ownerId !== decodedToken.uid) {
      return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });
    }

    const filePath = `pets-pictures/${petId}/${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({
      metadata: { contentType: req.file.mimetype },
    });

    blobStream.on('error', (error) => { 
        console.error("Error en blobStream (mascota):", error);
        res.status(500).json({ message: 'Error durante la subida del archivo.' });
    });

    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        await petRef.update({ petPictureUrl: publicUrl });
        res.status(200).json({ message: 'Foto de mascota actualizada.', petPictureUrl: publicUrl });
      } catch (error) {
        console.error("Error al procesar foto de mascota:", error);
        res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });
      }
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error('Error en /api/pets/:petId/picture:', error);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ message: 'Token expirado, por favor inicie sesión de nuevo.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


app.get('/api/public/pets/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const petDoc = await db.collection('pets').doc(petId).get();
    if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });
    
    const petData = petDoc.data();
    const userDoc = await db.collection('users').doc(petData.ownerId).get();
    
    const ownerData = userDoc.exists ? userDoc.data() : { name: 'N/A', phone: 'N/A' };
    
    const publicProfile = {
      pet: { name: petData.name, breed: petData.breed, petPictureUrl: petData.petPictureUrl },
      owner: { name: ownerData.name, phone: ownerData.phone }
    };
    res.status(200).json(publicProfile);
  } catch (error) {
    console.error('Error en /api/public/pets/:petId:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// -----------------------------------------------------------------------------
// Server Initialization
// -----------------------------------------------------------------------------
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
