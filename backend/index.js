// backend/index.js
// Versión: 4.5 - Sistema de Comentarios
// Añade endpoints para crear y obtener comentarios en las publicaciones.

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

app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v4.5 - Sistema de Comentarios' }));

// --- Endpoints ---
app.post('/api/register', async (req, res) => {try {const { email, password, name } = req.body;if (!email || !password || !name) {return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });}const userRecord = await auth.createUser({ email, password, displayName: name });const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await db.collection('users').doc(userRecord.uid).set(newUser);res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });} catch (error) {console.error('Error en /api/register:', error);if (error.code === 'auth/email-already-exists') {return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });}if (error.code === 'auth/invalid-password') {return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });}res.status(500).json({ message: 'Error al registrar el usuario.' });}});
app.post('/api/auth/google', async (req, res) => {const { idToken } = req.body;if (!idToken) return res.status(400).json({ message: 'Se requiere el idToken de Google.' });try {const decodedToken = await auth.verifyIdToken(idToken);const { uid, name, email, picture } = decodedToken;const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (!userDoc.exists) {const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: picture || '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await userRef.set(newUser);return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });} else {return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });}} catch (error) {console.error('Error en /api/auth/google:', error);res.status(500).json({ message: 'Error en la autenticación con Google.' });}});
app.get('/api/public/pets/:petId', async (req, res) => {try {const { petId } = req.params;const petDoc = await db.collection('pets').doc(petId).get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });const petData = petDoc.data();const userDoc = await db.collection('users').doc(petData.ownerId).get();let ownerData = { id: petData.ownerId, name: 'Responsable', phone: 'No disponible' };if (userDoc.exists) {const fullOwnerData = userDoc.data();ownerData = {id: petData.ownerId, name: fullOwnerData.name,phone: fullOwnerData.phone || 'No proporcionado'};}const publicProfile = {pet: { ...petData }, owner: ownerData};res.status(200).json(publicProfile);} catch (error) {console.error('Error en /api/public/pets/:petId:', error);res.status(500).json({ message: 'Error interno del servidor.' });}});

app.use(authenticateUser);

app.get('/api/profile', async (req, res) => {try{const userDoc = await db.collection('users').doc(req.user.uid).get();if (!userDoc.exists) return res.status(404).json({ message: 'Perfil no encontrado.' });res.status(200).json(userDoc.data());}catch(e){res.status(500).json({ message: 'Error interno del servidor.' })}});
app.put('/api/profile', async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, bio, location, phone } = req.body;
    const dataToSave = {};
    if (name !== undefined) dataToSave.name = name;
    if (bio !== undefined) dataToSave.bio = bio;
    if (location !== undefined) dataToSave.location = location;
    if (phone !== undefined) dataToSave.phone = phone;
    if (Object.keys(dataToSave).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
    }
    await db.collection('users').doc(uid).set(dataToSave, { merge: true });
    res.status(200).json({ message: 'Perfil actualizado con éxito.' });
  } catch(e) {
    console.error('Error en /api/profile (PUT):', e);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});
app.post('/api/profile/picture', async (req, res) => {try {const { uid } = req.user;if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });const filePath = `profile-pictures/${uid}/${Date.now()}-${req.file.originalname}`;const fileUpload = bucket.file(filePath);const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida del archivo.' }));blobStream.on('finish', async () => {try {await fileUpload.makePublic();const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;await db.collection('users').doc(uid).set({ profilePictureUrl: publicUrl }, { merge: true });res.status(200).json({ message: 'Foto actualizada.', profilePictureUrl: publicUrl });} catch (error) {res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });}});blobStream.end(req.file.buffer);} catch (error) {res.status(500).json({ message: 'Error interno del servidor.' });}});
app.put('/api/pets/:petId', async (req, res) => {const { uid } = req.user;const { petId } = req.params;const updateData = req.body;try {if (!updateData || Object.keys(updateData).length === 0) {return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });}const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) {return res.status(404).json({ message: 'Mascota no encontrada.' });}if (petDoc.data().ownerId !== uid) {return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });}await petRef.set(updateData, { merge: true });try {if (updateData.location && updateData.location.city) {const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (userDoc.exists) {const userData = userDoc.data();if (!userData.location || !userData.location.city) {await userRef.set({ location: updateData.location }, { merge: true });}}}} catch (implicitLocationError) {console.error('[IMPLICIT_LOCATION_ERROR] Failed to update user location implicitly:', implicitLocationError);}res.status(200).json({ message: 'Mascota actualizada con éxito.' });} catch (error) {console.error(`[PETS_UPDATE_FATAL] A critical error occurred while updating pet ${petId}:`, error);res.status(500).json({ message: 'Error interno del servidor al actualizar la mascota.' });}});
app.post('/api/pets', async (req, res) => {try {const { uid } = req.user;const { name, breed } = req.body;if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });const petData = {ownerId: uid,name,breed: breed || '',createdAt: new Date().toISOString(),petPictureUrl: '',location: {country: 'Colombia',department: '',city: ''},healthRecord: {birthDate: '',gender: '',}};const petRef = await db.collection('pets').add(petData);res.status(201).json({ message: 'Mascota registrada.', petId: petRef.id });} catch (error) {console.error('Error en /api/pets (POST):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.get('/api/pets', async (req, res) => {try {const { uid } = req.user;const petsSnapshot = await db.collection('pets').where('ownerId', '==', uid).get();const petsList = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));res.status(200).json(petsList);} catch (error) {console.error('Error en /api/pets (GET):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
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
app.get('/api/posts/by-author/:authorId', async (req, res) => {
    try {
        const { authorId } = req.params;
        const postsQuery = await db.collection('posts')
            .where('authorId', '==', authorId)
            .orderBy('createdAt', 'desc')
            .get();
        const posts = postsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(posts);
    } catch (error) {
        console.error(`Error fetching posts for author ${req.params.authorId}:`, error);
        res.status(500).json({ message: 'Error al obtener las publicaciones.' });
    }
});
app.post('/api/profiles/:profileId/follow', async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;
    if (uid === profileId) return res.status(400).json({ message: 'No puedes seguirte a ti mismo.' });
    const currentUserRef = db.collection('users').doc(uid);
    const followedPetRef = db.collection('pets').doc(profileId);
    try {
        await db.runTransaction(async (t) => {
            const petDoc = await t.get(followedPetRef);
            if (!petDoc.exists) throw new Error("La mascota que intentas seguir no existe.");
            t.set(currentUserRef.collection('following').doc(profileId), { followedAt: new Date() });
            t.set(followedPetRef.collection('followers').doc(uid), { followedAt: new Date() });
        });
        res.status(200).json({ message: 'Ahora sigues a este perfil.' });
    } catch (error) {
        console.error('Error al seguir al perfil:', error);
        res.status(500).json({ message: error.message || 'No se pudo completar la acción.' });
    }
});
app.delete('/api/profiles/:profileId/unfollow', async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;
    const currentUserRef = db.collection('users').doc(uid);
    const followedPetRef = db.collection('pets').doc(profileId);
    try {
        await db.runTransaction(async (t) => {
            t.delete(currentUserRef.collection('following').doc(profileId));
            t.delete(followedPetRef.collection('followers').doc(uid));
        });
        res.status(200).json({ message: 'Has dejado de seguir a este perfil.' });
    } catch (error) {
        console.error('Error al dejar de seguir al perfil:', error);
        res.status(500).json({ message: 'No se pudo completar la acción.' });
    }
});
app.get('/api/profiles/:profileId/follow-status', async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;
    try {
        const followDoc = await db.collection('users').doc(uid).collection('following').doc(profileId).get();
        res.status(200).json({ isFollowing: followDoc.exists });
    } catch (error) {
        console.error('Error al verificar el estado de seguimiento:', error);
        res.status(500).json({ message: 'No se pudo verificar el estado de seguimiento.' });
    }
});
app.post('/api/posts/:postId/like', async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    const postRef = db.collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(uid);

    try {
        await db.runTransaction(async (t) => {
            const likeDoc = await t.get(likeRef);
            if (likeDoc.exists) return;
            t.set(likeRef, { likedAt: new Date() });
            t.update(postRef, { likesCount: admin.firestore.FieldValue.increment(1) });
        });
        res.status(200).json({ message: 'Like añadido.' });
    } catch (error) {
        console.error('Error al dar like:', error);
        res.status(500).json({ message: 'No se pudo añadir el like.' });
    }
});
app.delete('/api/posts/:postId/unlike', async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    const postRef = db.collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(uid);

    try {
        await db.runTransaction(async (t) => {
            const likeDoc = await t.get(likeRef);
            if (!likeDoc.exists) return;
            t.delete(likeRef);
            t.update(postRef, { likesCount: admin.firestore.FieldValue.increment(-1) });
        });
        res.status(200).json({ message: 'Like eliminado.' });
    } catch (error) {
        console.error('Error al quitar like:', error);
        res.status(500).json({ message: 'No se pudo quitar el like.' });
    }
});
app.post('/api/posts/like-statuses', async (req, res) => {
    const { uid } = req.user;
    const { postIds } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) return res.status(200).json({});
    try {
        const likePromises = postIds.map(postId => 
            db.collection('posts').doc(postId).collection('likes').doc(uid).get()
        );
        const likeSnapshots = await Promise.all(likePromises);
        const statuses = {};
        likeSnapshots.forEach((doc, index) => {
            const postId = postIds[index];
            statuses[postId] = doc.exists;
        });
        res.status(200).json(statuses);
    } catch (error) {
        console.error('Error al verificar estados de likes:', error);
        res.status(500).json({ message: 'No se pudieron verificar los likes.' });
    }
});

// [NUEVO] Endpoints para Comentarios
app.post('/api/posts/:postId/comment', async (req, res) => {
    const { uid, name, picture } = req.user;
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'El comentario no puede estar vacío.' });
    }

    const postRef = db.collection('posts').doc(postId);
    const commentRef = postRef.collection('comments').doc();

    try {
        const newComment = {
            id: commentRef.id,
            authorId: uid,
            authorName: name,
            authorProfilePic: picture || '',
            text,
            createdAt: new Date().toISOString()
        };

        await db.runTransaction(async (t) => {
            t.set(commentRef, newComment);
            t.update(postRef, { commentsCount: admin.firestore.FieldValue.increment(1) });
        });

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error al añadir comentario:', error);
        res.status(500).json({ message: 'No se pudo añadir el comentario.' });
    }
});

app.get('/api/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    try {
        const commentsQuery = await db.collection('posts').doc(postId).collection('comments')
            .orderBy('createdAt', 'asc')
            .get();
        
        const comments = commentsQuery.docs.map(doc => doc.data());
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ message: 'No se pudieron obtener los comentarios.' });
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
