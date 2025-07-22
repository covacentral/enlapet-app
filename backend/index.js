// backend/index.js
// Versión: 3.4 - CORS Abierto para Diagnóstico
// Desactiva temporalmente las restricciones de CORS para una prueba definitiva. ¡NO USAR EN PRODUCCIÓN!

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');

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
  console.error('ERROR FATAL: No se pudo inicializar Firebase Admin SDK.', error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
const app = express();
const PORT = process.env.PORT || 3001;

// [DIAGNÓSTICO] Se abre CORS completamente para la prueba.
app.use(cors()); 

app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const authenticateUser = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return res.status(401).json({ message: 'No autenticado.' });
  try {
    req.user = await auth.verifyIdToken(idToken);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v3.4 - CORS Abierto para Diagnóstico' }));

// --- Endpoints (sin cambios en la lógica interna) ---
app.post('/api/register', async (req, res) => {try {const { email, password, name } = req.body;if (!email || !password || !name) {return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });}const userRecord = await auth.createUser({ email, password, displayName: name });const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await db.collection('users').doc(userRecord.uid).set(newUser);res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });} catch (error) {console.error('Error en /api/register:', error);if (error.code === 'auth/email-already-exists') {return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });}if (error.code === 'auth/invalid-password') {return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });}res.status(500).json({ message: 'Error al registrar el usuario.' });}});
app.post('/api/auth/google', async (req, res) => {const { idToken } = req.body;if (!idToken) return res.status(400).json({ message: 'Se requiere el idToken de Google.' });try {const decodedToken = await auth.verifyIdToken(idToken);const { uid, name, email, picture } = decodedToken;const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (!userDoc.exists) {const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: picture || '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await userRef.set(newUser);return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });} else {return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });}} catch (error) {console.error('Error en /api/auth/google:', error);res.status(500).json({ message: 'Error en la autenticación con Google.' });}});
app.get('/api/public/pets/:petId', async (req, res) => {try {const { petId } = req.params;const petDoc = await db.collection('pets').doc(petId).get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });const petData = petDoc.data();const userDoc = await db.collection('users').doc(petData.ownerId).get();let ownerData = { name: 'Responsable', phone: 'No disponible' };if (userDoc.exists) {const fullOwnerData = userDoc.data();ownerData = {name: fullOwnerData.name,phone: fullOwnerData.phone || 'No proporcionado'};}const publicProfile = {pet: { name: petData.name, breed: petData.breed, petPictureUrl: petData.petPictureUrl },owner: ownerData};res.status(200).json(publicProfile);} catch (error) {console.error('Error en /api/public/pets/:petId:', error);res.status(500).json({ message: 'Error interno del servidor.' });}});

app.use(authenticateUser);

app.get('/api/profile', async (req, res) => {try{const userDoc = await db.collection('users').doc(req.user.uid).get();if (!userDoc.exists) return res.status(404).json({ message: 'Perfil no encontrado.' });res.status(200).json(userDoc.data());}catch(e){res.status(500).json({ message: 'Error interno del servidor.' })}});
app.put('/api/profile', async (req, res) => {
  const { uid } = req.user;
  const receivedData = req.body;
  console.log(`--- [PROFILE_UPDATE_DEBUG] START ---`);
  console.log(`[1] User ID: ${uid}`);
  console.log(`[2] Raw request body received:`, JSON.stringify(receivedData, null, 2));
  try {
    const { name, bio, location, phone } = receivedData;
    console.log(`[3] Deconstructed values:`);
    console.log(`   - name: ${name} (type: ${typeof name})`);
    console.log(`   - bio: ${bio} (type: ${typeof bio})`);
    console.log(`   - phone: ${phone} (type: ${typeof phone})`);
    console.log(`   - location: ${JSON.stringify(location)} (type: ${typeof location})`);
    const dataToSave = {};
    if (name !== undefined) dataToSave.name = name;
    if (bio !== undefined) dataToSave.bio = bio;
    if (location !== undefined) dataToSave.location = location;
    if (phone !== undefined) dataToSave.phone = phone;
    if (Object.keys(dataToSave).length === 0) {
        console.log('[4] FAIL: No valid data provided to save.');
        console.log(`--- [PROFILE_UPDATE_DEBUG] END ---`);
        return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }
    console.log('[4] SUCCESS: Data to save is prepared:', JSON.stringify(dataToSave, null, 2));
    const userRef = db.collection('users').doc(uid);
    await userRef.set(dataToSave, { merge: true })
      .then(() => {
        console.log('[5] SUCCESS: Firestore write operation completed successfully.');
        console.log(`--- [PROFILE_UPDATE_DEBUG] END ---`);
        res.status(200).json({ message: 'Perfil actualizado con éxito.' });
      })
      .catch(firestoreError => {
        console.error('[5] FAIL: Firestore write operation failed.', firestoreError);
        console.log(`--- [PROFILE_UPDATE_DEBUG] END ---`);
        throw firestoreError;
      });
  } catch(e) {
    console.error('[FATAL] An unexpected error occurred in /api/profile (PUT):', e);
    console.log(`--- [PROFILE_UPDATE_DEBUG] END ---`);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});
app.post('/api/profile/picture', async (req, res) => {try {const { uid } = req.user;if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });const filePath = `profile-pictures/${uid}/${Date.now()}-${req.file.originalname}`;const fileUpload = bucket.file(filePath);const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida del archivo.' }));blobStream.on('finish', async () => {try {await fileUpload.makePublic();const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;await db.collection('users').doc(uid).set({ profilePictureUrl: publicUrl }, { merge: true });res.status(200).json({ message: 'Foto actualizada.', profilePictureUrl: publicUrl });} catch (error) {res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });}});blobStream.end(req.file.buffer);} catch (error) {res.status(500).json({ message: 'Error interno del servidor.' });}});
app.put('/api/pets/:petId', async (req, res) => {const { uid } = req.user;const { petId } = req.params;const updateData = req.body;console.log(`[PETS_UPDATE_START] User ${uid} is updating pet ${petId}`);console.log('[PETS_UPDATE_DATA] Received data:', JSON.stringify(updateData, null, 2));try {if (!updateData || Object.keys(updateData).length === 0) {console.log('[PETS_UPDATE_FAIL] No data provided.');return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });}const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) {console.log(`[PETS_UPDATE_FAIL] Pet ${petId} not found.`);return res.status(404).json({ message: 'Mascota no encontrada.' });}if (petDoc.data().ownerId !== uid) {console.log(`[PETS_UPDATE_FAIL] User ${uid} is not the owner of pet ${petId}.`);return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });}console.log(`[PETS_UPDATE_FIRESTORE] Attempting to save data for pet ${petId}...`);await petRef.set(updateData, { merge: true });console.log(`[PETS_UPDATE_SUCCESS] Firestore save successful for pet ${petId}.`);try {if (updateData.location && updateData.location.city) {const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (userDoc.exists) {const userData = userDoc.data();if (!userData.location || !userData.location.city) {console.log(`[IMPLICIT_LOCATION] Updating location for user ${uid}.`);await userRef.set({ location: updateData.location }, { merge: true });}}}} catch (implicitLocationError) {console.error('[IMPLICIT_LOCATION_ERROR] Failed to update user location implicitly:', implicitLocationError);}res.status(200).json({ message: 'Mascota actualizada con éxito.' });} catch (error) {console.error(`[PETS_UPDATE_FATAL] A critical error occurred while updating pet ${petId}:`, error);res.status(500).json({ message: 'Error interno del servidor al actualizar la mascota.' });}});
app.post('/api/pets', async (req, res) => {try {const { uid } = req.user;const { name, breed } = req.body;if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });const petData = {ownerId: uid,name,breed: breed || '',createdAt: new Date().toISOString(),petPictureUrl: '',location: {country: 'Colombia',department: '',city: ''},healthRecord: {birthDate: '',gender: '',}};const petRef = await db.collection('pets').add(petData);res.status(201).json({ message: 'Mascota registrada.', petId: petRef.id });} catch (error) {console.error('Error en /api/pets (POST):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.get('/api/pets', async (req, res) => {try {const { uid } = req.user;const petsSnapshot = await db.collection('pets').where('ownerId', '==', uid).get();const petsList = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));res.status(200).json(petsList);} catch (error) {console.error('Error en /api/pets (GET):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.get('/api/pets/:petId/health-record', async (req, res) => {try {const { uid } = req.user;const { petId } = req.params;const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });if (petDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado.' });res.status(200).json(petDoc.data().healthRecord || {});} catch (error) {console.error('Error en /api/pets/:petId/health-record (GET):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.put('/api/pets/:petId/health-record', async (req, res) => {try {const { uid } = req.user;const { petId } = req.params;const healthRecordData = req.body;const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });if (petDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado.' });await petRef.set({ healthRecord: healthRecordData }, { merge: true });res.status(200).json({ message: 'Hoja de vida actualizada con éxito.' });} catch (error) {console.error('Error en /api/pets/:petId/health-record (PUT):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.post('/api/pets/:petId/picture', async (req, res) => {try {const { uid } = req.user;if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });const { petId } = req.params;const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });if (petDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado.' });const filePath = `pets-pictures/${petId}/${Date.now()}-${req.file.originalname}`;const fileUpload = bucket.file(filePath);const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida del archivo.' }));blobStream.on('finish', async () => {try {await fileUpload.makePublic();const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;await petRef.update({ petPictureUrl: publicUrl });res.status(200).json({ message: 'Foto de mascota actualizada.', petPictureUrl: publicUrl });} catch (error) {res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });}});blobStream.end(req.file.buffer);} catch (error) {res.status(500).json({ message: 'Error interno del servidor.' });}});

app.post('/api/posts', upload.single('postImage'), async (req, res) => {
    const { uid } = req.user;
    const { caption, authorId, authorType } = req.body;
    if (!req.file || !caption || !authorId || !authorType) {
        return res.status(400).json({ message: 'Se requiere una imagen, un texto, un ID de autor y un tipo de autor.' });
    }
    let authorName = '';
    let authorProfilePic = '';
    try {
        if (authorType === 'pet') {
            const petDoc = await db.collection('pets').doc(authorId).get();
            if (!petDoc.exists || petDoc.data().ownerId !== uid) {
                return res.status(403).json({ message: 'No autorizado para publicar en nombre de esta mascota.' });
            }
            authorName = petDoc.data().name;
            authorProfilePic = petDoc.data().petPictureUrl;
        } else {
            const userDoc = await db.collection('users').doc(authorId).get();
            if (!userDoc.exists || authorId !== uid) {
                return res.status(403).json({ message: 'No autorizado para publicar como este usuario.' });
            }
            authorName = userDoc.data().name;
            authorProfilePic = userDoc.data().profilePictureUrl;
        }
    } catch (error) {
        console.error('Error al obtener datos del autor:', error);
        return res.status(500).json({ message: 'Error al verificar el autor de la publicación.' });
    }
    const postRef = db.collection('posts').doc();
    const filePath = `posts/${uid}/${postRef.id}/${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({
        metadata: { contentType: req.file.mimetype },
    });
    blobStream.on('error', (error) => {
        console.error("Error en blobStream (post):", error);
        return res.status(500).json({ message: 'Error durante la subida de la imagen.' });
    });
    blobStream.on('finish', async () => {
        try {
            await fileUpload.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            const newPost = {
                authorId, authorName, authorProfilePic, imageUrl, caption,
                createdAt: new Date().toISOString(), likesCount: 0, commentsCount: 0
            };
            await postRef.set(newPost);
            res.status(201).json({ message: 'Publicación creada con éxito.', postId: postRef.id });
        } catch (error) {
            console.error("Error al crear el documento del post:", error);
            return res.status(500).json({ message: 'Error al guardar la publicación.' });
        }
    });
    blobStream.end(req.file.buffer);
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
