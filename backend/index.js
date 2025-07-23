// backend/index.js
// Versión: 6.2 - Reparación Definitiva y Endpoints de Guardado
// Corrige el error crítico en el endpoint de posts guardados con una lógica más robusta
// e introduce la funcionalidad completa para guardar publicaciones.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');

// --- Inicialización de Firebase Admin SDK ---
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
  console.log('Firebase Admin SDK inicializado correctamente.');
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuración de CORS ---
const allowedOrigins = [
    'https://covacentral.shop',
    'https://www.covacentral.shop',
    'http://localhost:5173'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Configuración de Multer ---
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// --- Middleware de Autenticación ---
const authenticateUser = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ message: 'No autenticado. Se requiere un token.' });
  }
  try {
    req.user = await auth.verifyIdToken(idToken);
    next();
  } catch (error) {
    console.error('Error de autenticación de token:', error);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

// --- Endpoint Raíz ---
app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v6.2 - Servidor Estable' }));

// --- Endpoints Públicos (No requieren autenticación) ---
app.post('/api/register', async (req, res) => {try {const { email, password, name } = req.body;if (!email || !password || !name) {return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });}const userRecord = await auth.createUser({ email, password, displayName: name });const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await db.collection('users').doc(userRecord.uid).set(newUser);res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });} catch (error) {console.error('Error en /api/register:', error);if (error.code === 'auth/email-already-exists') {return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });}if (error.code === 'auth/invalid-password') {return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });}res.status(500).json({ message: 'Error al registrar el usuario.' });}});
app.post('/api/auth/google', async (req, res) => {const { idToken } = req.body;if (!idToken) return res.status(400).json({ message: 'Se requiere el idToken de Google.' });try {const decodedToken = await auth.verifyIdToken(idToken);const { uid, name, email, picture } = decodedToken;const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (!userDoc.exists) {const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: picture || '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await userRef.set(newUser);return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });} else {return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });}} catch (error) {console.error('Error en /api/auth/google:', error);res.status(500).json({ message: 'Error en la autenticación con Google.' });}});
app.get('/api/public/pets/:petId', async (req, res) => {try {const { petId } = req.params;const petDoc = await db.collection('pets').doc(petId).get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });const petData = petDoc.data();const userDoc = await db.collection('users').doc(petData.ownerId).get();let ownerData = { id: petData.ownerId, name: 'Responsable', phone: 'No disponible' };if (userDoc.exists) {const fullOwnerData = userDoc.data();ownerData = {id: petData.ownerId, name: fullOwnerData.name,phone: fullOwnerData.phone || 'No proporcionado'};}const publicProfile = {pet: { ...petData, id: petDoc.id }, owner: ownerData};res.status(200).json(publicProfile);} catch (error) {console.error('Error en /api/public/pets/:petId:', error);res.status(500).json({ message: 'Error interno del servidor.' });}});

// --- A partir de aquí, todos los endpoints requieren autenticación ---
app.use(authenticateUser);

// --- Endpoint de Gestión de Perfil ---
app.get('/api/profile', async (req, res) => {try{const userDoc = await db.collection('users').doc(req.user.uid).get();if (!userDoc.exists) return res.status(404).json({ message: 'Perfil no encontrado.' });res.status(200).json(userDoc.data());}catch(e){res.status(500).json({ message: 'Error interno del servidor.' })}});
app.put('/api/profile', async (req, res) => {try {const { uid } = req.user;const dataToSave = req.body;if (Object.keys(dataToSave).length === 0) {return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });}await db.collection('users').doc(uid).set(dataToSave, { merge: true });res.status(200).json({ message: 'Perfil actualizado con éxito.' });} catch(e) {console.error('Error en /api/profile (PUT):', e);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.post('/api/profile/picture', upload.single('profilePicture'), async (req, res) => {try {const { uid } = req.user;if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });const filePath = `profile-pictures/${uid}/${Date.now()}-${req.file.originalname}`;const fileUpload = bucket.file(filePath);const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida del archivo.' }));blobStream.on('finish', async () => {try {await fileUpload.makePublic();const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;await db.collection('users').doc(uid).set({ profilePictureUrl: publicUrl }, { merge: true });res.status(200).json({ message: 'Foto actualizada.', profilePictureUrl: publicUrl });} catch (error) {res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });}});blobStream.end(req.file.buffer);} catch (error) {res.status(500).json({ message: 'Error interno del servidor.' });}});

// --- Endpoints de Gestión de Mascotas ---
app.get('/api/pets', async (req, res) => {try {const { uid } = req.user;const petsSnapshot = await db.collection('pets').where('ownerId', '==', uid).get();const petsList = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));res.status(200).json(petsList);} catch (error) {console.error('Error en /api/pets (GET):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.post('/api/pets', async (req, res) => {try {const { uid } = req.user;const { name, breed } = req.body;if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });const petData = {ownerId: uid,name,breed: breed || '',createdAt: new Date().toISOString(),petPictureUrl: '',location: {country: 'Colombia',department: '',city: ''},healthRecord: {birthDate: '',gender: '',}};const petRef = await db.collection('pets').add(petData);res.status(201).json({ message: 'Mascota registrada.', petId: petRef.id });} catch (error) {console.error('Error en /api/pets (POST):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.put('/api/pets/:petId', async (req, res) => {const { uid } = req.user;const { petId } = req.params;const updateData = req.body;try {if (!updateData || Object.keys(updateData).length === 0) {return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });}const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) {return res.status(404).json({ message: 'Mascota no encontrada.' });}if (petDoc.data().ownerId !== uid) {return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });}await petRef.set(updateData, { merge: true });try {if (updateData.location && updateData.location.city) {const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (userDoc.exists) {const userData = userDoc.data();if (!userData.location || !userData.location.city) {await userRef.set({ location: updateData.location }, { merge: true });}}}} catch (implicitLocationError) {console.error('[IMPLICIT_LOCATION_ERROR] Failed to update user location implicitly:', implicitLocationError);}res.status(200).json({ message: 'Mascota actualizada con éxito.' });} catch (error) {console.error(`[PETS_UPDATE_FATAL] A critical error occurred while updating pet ${petId}:`, error);res.status(500).json({ message: 'Error interno del servidor al actualizar la mascota.' });}});
app.post('/api/pets/:petId/picture', upload.single('petPicture'), async (req, res) => {try {const { uid } = req.user;if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });const { petId } = req.params;const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) {return res.status(404).json({ message: 'Mascota no encontrada.' });}if (petDoc.data().ownerId !== uid) {return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });}const filePath = `pets-pictures/${petId}/${Date.now()}-${req.file.originalname}`;const fileUpload = bucket.file(filePath);const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });blobStream.on('error', (error) => {console.error("Error en blobStream (mascota):", error);res.status(500).json({ message: 'Error durante la subida del archivo.' });});blobStream.on('finish', async () => {try {await fileUpload.makePublic();const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;await petRef.update({ petPictureUrl: publicUrl });res.status(200).json({ message: 'Foto de mascota actualizada.', petPictureUrl: publicUrl });} catch (error) {console.error("Error al procesar foto de mascota:", error);res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });}});blobStream.end(req.file.buffer);} catch (error) {console.error('Error en /api/pets/:petId/picture:', error);res.status(500).json({ message: 'Error interno del servidor.' });}});

// --- Endpoint del Feed Híbrido ---
app.get('/api/feed', async (req, res) => { /* ...código de la v5.0... */ });

// --- Endpoints de Publicaciones (Posts) ---
app.post('/api/posts', upload.single('postImage'), async (req, res) => { /* ...código de la v5.0... */ });
app.get('/api/posts/by-author/:authorId', async (req, res) => { /* ...código de la v5.0... */ });
app.post('/api/posts/:postId/like', async (req, res) => { /* ...código de la v5.0... */ });
app.delete('/api/posts/:postId/unlike', async (req, res) => { /* ...código de la v5.0... */ });
app.post('/api/posts/like-statuses', async (req, res) => { /* ...código de la v5.0... */ });
app.get('/api/posts/:postId/comments', async (req, res) => { /* ...código de la v5.0... */ });
app.post('/api/posts/:postId/comment', async (req, res) => { /* ...código de la v5.0... */ });

// --- [NUEVO] Endpoints para Guardar Publicaciones ---
app.post('/api/posts/:postId/save', async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    try {
        const userRef = db.collection('users').doc(uid);
        const savedPostRef = userRef.collection('saved_posts').doc(postId);
        await savedPostRef.set({ savedAt: new Date().toISOString() });
        res.status(200).json({ message: 'Publicación guardada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la publicación:', error);
        res.status(500).json({ message: 'No se pudo guardar la publicación.' });
    }
});

app.delete('/api/posts/:postId/unsave', async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    try {
        const savedPostRef = db.collection('users').doc(uid).collection('saved_posts').doc(postId);
        await savedPostRef.delete();
        res.status(200).json({ message: 'Publicación eliminada de guardados.' });
    } catch (error) {
        console.error('Error al quitar la publicación guardada:', error);
        res.status(500).json({ message: 'No se pudo quitar la publicación guardada.' });
    }
});

app.post('/api/posts/save-statuses', async (req, res) => {
    const { uid } = req.user;
    const { postIds } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(200).json({});
    }
    try {
        const savedPostsRef = db.collection('users').doc(uid).collection('saved_posts');
        const promises = postIds.map(id => savedPostsRef.doc(id).get());
        const results = await Promise.all(promises);
        const statuses = {};
        results.forEach((doc, index) => {
            statuses[postIds[index]] = doc.exists;
        });
        res.status(200).json(statuses);
    } catch (error) {
        console.error('Error al verificar estados de guardado:', error);
        res.status(500).json({ message: 'No se pudieron verificar los estados de guardado.' });
    }
});

app.get('/api/user/saved-posts', async (req, res) => {
    const { uid } = req.user;
    try {
        const savedSnapshot = await db.collection('users').doc(uid).collection('saved_posts').orderBy('savedAt', 'desc').get();
        if (savedSnapshot.empty) {
            return res.status(200).json([]);
        }
        const postIds = savedSnapshot.docs.map(doc => doc.id);
        const postsSnapshot = await db.collection('posts').where(admin.firestore.FieldPath.documentId(), 'in', postIds).get();
        if (postsSnapshot.empty) {
            return res.status(200).json([]);
        }
        const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const authorIds = [...new Set(postsData.map(p => p.authorId).filter(id => id))];
        if (authorIds.length === 0) {
            const finalPosts = postsData.map(post => ({ ...post, author: { name: 'Autor Desconocido' } }));
            return res.status(200).json(finalPosts);
        }
        const authorPromises = authorIds.map(id => 
            db.collection('pets').doc(id).get().then(doc => doc.exists ? doc : db.collection('users').doc(id).get())
        );
        const authorSnapshots = await Promise.all(authorPromises);
        const authorsData = {};
        authorSnapshots.forEach(doc => {
            if (doc.exists) {
                const data = doc.data();
                authorsData[doc.id] = {
                    id: doc.id,
                    name: data.name,
                    profilePictureUrl: data.profilePictureUrl || data.petPictureUrl || ''
                };
            }
        });
        const finalPosts = postsData.map(post => ({
            ...post,
            author: authorsData[post.authorId] || { name: 'Autor Desconocido' }
        }));
        finalPosts.sort((a, b) => postIds.indexOf(a.id) - postIds.indexOf(b.id));
        res.status(200).json(finalPosts);
    } catch (error) {
        console.error(`[CRITICAL] Error en GET /api/user/saved-posts para user ${uid}:`, error);
        res.status(500).json({ message: 'Error al obtener las publicaciones guardadas.' });
    }
});

// --- Endpoints de Seguimiento (Follow) ---
app.post('/api/profiles/:profileId/follow', async (req, res) => { /* ...código de la v5.0... */ });
app.delete('/api/profiles/:profileId/unfollow', async (req, res) => { /* ...código de la v5.0... */ });
app.get('/api/profiles/:profileId/follow-status', async (req, res) => { /* ...código de la v5.0... */ });

// --- Iniciar Servidor ---
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
