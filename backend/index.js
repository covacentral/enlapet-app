// --- CONFIGURACIÓN DE VARIABLES DE ENTORNO ---
// Esta línea debe ir al principio de todo.
// Carga las variables del archivo .env en process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');

try {
  const serviceAccount = require('./config/serviceAccountKey.json');
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
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Ahora, process.env.PORT leerá el valor de tu archivo .env
const PORT = process.env.PORT || 3001;

// ... (El resto de tus endpoints se mantienen exactamente igual)

app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet!' }));

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

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
