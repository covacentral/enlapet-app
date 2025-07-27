// backend/index.js
// Versión: 12.3 - Corrección Crítica de Eventos
// CORRIGE:
// 1. (Fechas) Se ajusta el endpoint de creación de eventos para que acepte directamente strings ISO 8601 desde el frontend, solucionando el bug de zona horaria.
// 2. (Estados) Se modifica la lógica de obtención de eventos para que los estados 'finished' y 'cancelled' sean permanentes y no se recalculen dinámicamente.

require('dotenv').config();
const express = require('express');
const cors =require('cors');
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
app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v12.3 - Corrección Eventos' }));

// --- Endpoints Públicos (No requieren autenticación) ---
app.post('/api/register', async (req, res) => {try {const { email, password, name } = req.body;if (!email || !password || !name) {return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });}const userRecord = await auth.createUser({ email, password, displayName: name });const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await db.collection('users').doc(userRecord.uid).set(newUser);res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });} catch (error) {console.error('Error en /api/register:', error);if (error.code === 'auth/email-already-exists') {return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });}if (error.code === 'auth/invalid-password') {return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });}res.status(500).json({ message: 'Error al registrar el usuario.' });}});
app.post('/api/auth/google', async (req, res) => {const { idToken } = req.body;if (!idToken) return res.status(400).json({ message: 'Se requiere el idToken de Google.' });try {const decodedToken = await auth.verifyIdToken(idToken);const { uid, name, email, picture } = decodedToken;const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (!userDoc.exists) {const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: picture || '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await userRef.set(newUser);return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });} else {return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });}} catch (error) {console.error('Error en /api/auth/google:', error);res.status(500).json({ message: 'Error en la autenticación con Google.' });}});
app.get('/api/public/pets/:petId', async (req, res) => {try {const { petId } = req.params;const petDoc = await db.collection('pets').doc(petId).get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });const petData = petDoc.data();const userDoc = await db.collection('users').doc(petData.ownerId).get();let ownerData = { id: petData.ownerId, name: 'Responsable', phone: 'No disponible' };if (userDoc.exists) {const fullOwnerData = userDoc.data();ownerData = {id: petData.ownerId, name: fullOwnerData.name,phone: fullOwnerData.phone || 'No proporcionado'};}const publicProfile = {pet: { ...petData, id: petDoc.id }, owner: ownerData};res.status(200).json(publicProfile);} catch (error) {console.error('Error en /api/public/pets/:petId:', error);res.status(500).json({ message: 'Error interno del servidor.' });}});


// --- A partir de aquí, todos los endpoints requieren autenticación ---
app.use(authenticateUser);

// ... (endpoints de perfil, mascotas, posts, etc. sin cambios)
app.get('/api/public/users/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const userData = userDoc.data();
        const followersSnapshot = await userRef.collection('followers').get();
        const followingSnapshot = await userRef.collection('following').get();

        const publicProfile = {
            id: userDoc.id,
            name: userData.name,
            profilePictureUrl: userData.profilePictureUrl || '',
            bio: userData.bio || '',
            followersCount: followersSnapshot.size || 0,
            followingCount: followingSnapshot.size || 0,
        };

        const petsSnapshot = await db.collection('pets').where('ownerId', '==', userId).get();
        const petsList = petsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            breed: doc.data().breed,
            petPictureUrl: doc.data().petPictureUrl || ''
        }));

        res.status(200).json({ userProfile: publicProfile, pets: petsList });

    } catch (error) {
        console.error(`Error en /api/public/users/${userId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
app.get('/api/profile', async (req, res) => {try{const userDoc = await db.collection('users').doc(req.user.uid).get();if (!userDoc.exists) return res.status(404).json({ message: 'Perfil no encontrado.' });res.status(200).json(userDoc.data());}catch(e){res.status(500).json({ message: 'Error interno del servidor.' })}});
app.put('/api/profile', async (req, res) => {try {const { uid } = req.user;const dataToSave = req.body;if (Object.keys(dataToSave).length === 0) {return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });}await db.collection('users').doc(uid).set(dataToSave, { merge: true });res.status(200).json({ message: 'Perfil actualizado con éxito.' });} catch(e) {console.error('Error en /api/profile (PUT):', e);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.post('/api/profile/picture', upload.single('profilePicture'), async (req, res) => {try {const { uid } = req.user;if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });const filePath = `profile-pictures/${uid}/${Date.now()}-${req.file.originalname}`;const fileUpload = bucket.file(filePath);const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida del archivo.' }));blobStream.on('finish', async () => {try {await fileUpload.makePublic();const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;await db.collection('users').doc(uid).set({ profilePictureUrl: publicUrl }, { merge: true });res.status(200).json({ message: 'Foto actualizada.', profilePictureUrl: publicUrl });} catch (error) {res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });}});blobStream.end(req.file.buffer);} catch (error) {res.status(500).json({ message: 'Error interno del servidor.' });}});
app.get('/api/pets', async (req, res) => {try {const { uid } = req.user;const petsSnapshot = await db.collection('pets').where('ownerId', '==', uid).get();const petsList = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));res.status(200).json(petsList);} catch (error) {console.error('Error en /api/pets (GET):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.post('/api/pets', async (req, res) => {try {const { uid } = req.user;const { name, breed } = req.body;if (!name) return res.status(400).json({ message: 'El nombre es requerido.' });const petData = {ownerId: uid,name,breed: breed || '',createdAt: new Date().toISOString(),petPictureUrl: '',location: {country: 'Colombia',department: '',city: ''},healthRecord: {birthDate: '',gender: '',vaccines: [], medicalHistory: []}};const petRef = await db.collection('pets').add(petData);res.status(201).json({ message: 'Mascota registrada.', petId: petRef.id });} catch (error) {console.error('Error en /api/pets (POST):', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.put('/api/pets/:petId', async (req, res) => {const { uid } = req.user;const { petId } = req.params;const updateData = req.body;try {if (!updateData || Object.keys(updateData).length === 0) {return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });}const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) {return res.status(404).json({ message: 'Mascota no encontrada.' });}if (petDoc.data().ownerId !== uid) {return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });}await petRef.set(updateData, { merge: true });try {if (updateData.location && updateData.location.city) {const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (userDoc.exists) {const userData = userDoc.data();if (!userData.location || !userData.location.city) {await userRef.set({ location: updateData.location }, { merge: true });}}}} catch (implicitLocationError) {console.error('[IMPLICIT_LOCATION_ERROR] Failed to update user location implicitly:', implicitLocationError);}res.status(200).json({ message: 'Mascota actualizada con éxito.' });} catch (error) {console.error(`[PETS_UPDATE_FATAL] A critical error occurred while updating pet ${petId}:`, error);res.status(500).json({ message: 'Error interno del servidor al actualizar la mascota.' });}});
app.post('/api/pets/:petId/picture', upload.single('petPicture'), async (req, res) => {try {const { uid } = req.user;if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });const { petId } = req.params;const petRef = db.collection('pets').doc(petId);const petDoc = await petRef.get();if (!petDoc.exists) {return res.status(404).json({ message: 'Mascota no encontrada.' });}if (petDoc.data().ownerId !== uid) {return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });}const filePath = `pets-pictures/${petId}/${Date.now()}-${req.file.originalname}`;const fileUpload = bucket.file(filePath);const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });blobStream.on('error', (error) => {console.error("Error en blobStream (mascota):", error);res.status(500).json({ message: 'Error durante la subida del archivo.' });});blobStream.on('finish', async () => {try {await fileUpload.makePublic();const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;await petRef.update({ petPictureUrl: publicUrl });res.status(200).json({ message: 'Foto de mascota actualizada.', petPictureUrl: publicUrl });} catch (error) {console.error("Error al procesar foto de mascota:", error);res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });}});blobStream.end(req.file.buffer);} catch (error) {console.error('Error en /api/pets/:petId/picture:', error);res.status(500).json({ message: 'Error interno del servidor.' });}});
app.post('/api/posts', upload.single('postImage'), async (req, res) => {
    const { uid } = req.user;
    const { caption, authorId, authorType } = req.body;
    if (!req.file || !caption || !authorId || !authorType) {
        return res.status(400).json({ message: 'Se requiere una imagen, un texto, un ID de autor y un tipo de autor.' });
    }
    let authorData = {};
    let authorRef;
    if (authorType === 'pet') {
        authorRef = db.collection('pets').doc(authorId);
    } else {
        authorRef = db.collection('users').doc(authorId);
    }

    try {
        const authorDoc = await authorRef.get();
        if (!authorDoc.exists) {
            return res.status(404).json({ message: 'Autor no encontrado.' });
        }
        if (authorType === 'pet' && authorDoc.data().ownerId !== uid) {
            return res.status(403).json({ message: 'No autorizado para publicar en nombre de esta mascota.' });
        }
        if (authorType === 'user' && authorId !== uid) {
            return res.status(403).json({ message: 'No autorizado para publicar como este usuario.' });
        }
        authorData = authorDoc.data();
    } catch (error) {
        console.error('Error al obtener datos del autor:', error);
        return res.status(500).json({ message: 'Error al verificar el autor de la publicación.' });
    }
    
    const postRef = db.collection('posts').doc();
    const filePath = `posts/${uid}/${postRef.id}/${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });

    blobStream.on('error', (error) => {
        console.error("Error en blobStream (post):", error);
        return res.status(500).json({ message: 'Error durante la subida de la imagen.' });
    });

    blobStream.on('finish', async () => {
        try {
            await fileUpload.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            const newPost = {
                authorId,
                authorType,
                authorLocation: authorData.location || null,
                imageUrl,
                caption,
                createdAt: new Date().toISOString(),
                likesCount: 0,
                commentsCount: 0
            };
            await postRef.set(newPost);
            
            const finalPost = {
                ...newPost,
                id: postRef.id,
                author: {
                    id: authorId,
                    name: authorData.name,
                    profilePictureUrl: authorData.profilePictureUrl || authorData.petPictureUrl || ''
                }
            };

            res.status(201).json({ message: 'Publicación creada con éxito.', post: finalPost });
        } catch (error) {
            console.error("Error al crear el documento del post:", error);
            return res.status(500).json({ message: 'Error al guardar la publicación.' });
        }
    });
    blobStream.end(req.file.buffer);
});
app.get('/api/posts/by-author/:authorId', async (req, res) => {try {const { authorId } = req.params;const postsQuery = await db.collection('posts').where('authorId', '==', authorId).orderBy('createdAt', 'desc').get();const posts = postsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));res.status(200).json(posts);} catch (error) {console.error(`Error fetching posts for author ${req.params.authorId}:`, error);res.status(500).json({ message: 'Error al obtener las publicaciones.' });}});
app.post('/api/posts/:postId/like', async (req, res) => {const { uid } = req.user;const { postId } = req.params;const postRef = db.collection('posts').doc(postId);const likeRef = postRef.collection('likes').doc(uid);try {await db.runTransaction(async (t) => {const likeDoc = await t.get(likeRef);if (likeDoc.exists) {return;}t.set(likeRef, { likedAt: new Date() });t.update(postRef, { likesCount: admin.firestore.FieldValue.increment(1) });});res.status(200).json({ message: 'Like añadido.' });} catch (error) {console.error('Error al dar like:', error);res.status(500).json({ message: 'No se pudo añadir el like.' });}});
app.delete('/api/posts/:postId/unlike', async (req, res) => {const { uid } = req.user;const { postId } = req.params;const postRef = db.collection('posts').doc(postId);const likeRef = postRef.collection('likes').doc(uid);try {await db.runTransaction(async (t) => {const likeDoc = await t.get(likeRef);if (!likeDoc.exists) {return;}t.delete(likeRef);t.update(postRef, { likesCount: admin.firestore.FieldValue.increment(-1) });});res.status(200).json({ message: 'Like eliminado.' });} catch (error) {console.error('Error al quitar like:', error);res.status(500).json({ message: 'No se pudo quitar el like.' });}});
app.post('/api/posts/like-statuses', async (req, res) => {const { uid } = req.user;const { postIds } = req.body;if (!Array.isArray(postIds) || postIds.length === 0) return res.status(200).json({});try {const likePromises = postIds.map(postId => db.collection('posts').doc(postId).collection('likes').doc(uid).get());const likeSnapshots = await Promise.all(likePromises);const statuses = {};likeSnapshots.forEach((doc, index) => {const postId = postIds[index];statuses[postId] = doc.exists;});res.status(200).json(statuses);} catch (error) {console.error('Error al verificar estados de likes:', error);res.status(500).json({ message: 'No se pudieron verificar los likes.' });}});
app.get('/api/posts/:postId/comments', async (req, res) => {const { postId } = req.params;try {const commentsQuery = await db.collection('posts').doc(postId).collection('comments').orderBy('createdAt', 'asc').get();const comments = commentsQuery.docs.map(doc => doc.data());res.status(200).json(comments);} catch (error) {console.error('Error al obtener comentarios:', error);res.status(500).json({ message: 'No se pudieron obtener los comentarios.' });}});
app.post('/api/posts/:postId/comment', async (req, res) => {const { uid } = req.user;const { postId } = req.params;const { text } = req.body;if (!text || text.trim() === '') {return res.status(400).json({ message: 'El comentario no puede estar vacío.' });}const postRef = db.collection('posts').doc(postId);const commentRef = postRef.collection('comments').doc();const userRef = db.collection('users').doc(uid);try {await db.runTransaction(async (t) => {const userDoc = await t.get(userRef);if (!userDoc.exists) {throw new Error("El usuario que comenta no existe.");}const userData = userDoc.data();const newComment = {id: commentRef.id,authorId: uid,authorName: userData.name,authorProfilePic: userData.profilePictureUrl || '',text,createdAt: new Date().toISOString()};t.set(commentRef, newComment);t.update(postRef, { commentsCount: admin.firestore.FieldValue.increment(1) });});const createdComment = (await commentRef.get()).data();res.status(201).json(createdComment);} catch (error) {console.error('Error al añadir comentario:', error);res.status(500).json({ message: 'No se pudo añadir el comentario.' });}});
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
app.post('/api/reports', async (req, res) => {
    const { uid } = req.user;
    const { contentId, reason } = req.body;

    if (!contentId || !reason) {
        return res.status(400).json({ message: 'Se requiere ID del contenido y una razón para el reporte.' });
    }

    const reportRef = db.collection('reports').doc(contentId);

    try {
        await db.runTransaction(async (transaction) => {
            const reportDoc = await transaction.get(reportRef);

            if (!reportDoc.exists) {
                const newReport = {
                    totalReports: 1,
                    reasons: { [reason]: 1 },
                    status: 'pending',
                    lastReportedAt: new Date().toISOString(),
                };
                transaction.set(reportRef, newReport);
            } else {
                const updateData = {
                    totalReports: admin.firestore.FieldValue.increment(1),
                    [`reasons.${reason}`]: admin.firestore.FieldValue.increment(1),
                    lastReportedAt: new Date().toISOString(),
                };
                transaction.update(reportRef, updateData);
            }
        });

        res.status(200).json({ message: 'Tu reporte ha sido registrado. Gracias por tu ayuda.' });
    } catch (error) {
        console.error('Error al procesar el reporte agregado:', error);
        res.status(500).json({ message: 'Error interno al procesar el reporte.' });
    }
});
app.get('/api/location-categories', async (req, res) => {
    try {
        const categoriesSnapshot = await db.collection('location_categories').where('isOfficial', '==', true).get();
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error al obtener categorías de lugares:', error);
        res.status(500).json({ message: 'Error interno al obtener las categorías.' });
    }
});
app.get('/api/locations', async (req, res) => {
    const { category } = req.query;
    try {
        let query = db.collection('locations').where('approved', '==', true);
        if (category) {
            query = query.where('category', '==', category);
        }
        const locationsSnapshot = await query.get();
        const locations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error al obtener lugares:', error);
        res.status(500).json({ message: 'Error interno al obtener los lugares.' });
    }
});
app.get('/api/locations/:locationId', async (req, res) => {
    const { locationId } = req.params;
    try {
        const locationDoc = await db.collection('locations').doc(locationId).get();
        if (!locationDoc.exists) {
            return res.status(404).json({ message: 'Lugar no encontrado.' });
        }
        const reviewsSnapshot = await db.collection('locations').doc(locationId).collection('reviews').orderBy('createdAt', 'desc').limit(10).get();
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());

        res.status(200).json({
            ...locationDoc.data(),
            id: locationDoc.id,
            reviews: reviews
        });
    } catch (error) {
        console.error(`Error al obtener detalles del lugar ${locationId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener los detalles del lugar.' });
    }
});
app.post('/api/locations', async (req, res) => {
    const { uid } = req.user;
    const { name, category, address, latitude, longitude, description, contact } = req.body;

    if (!name || !category || !latitude || !longitude) {
        return res.status(400).json({ message: 'Nombre, categoría y coordenadas son requeridos.' });
    }

    try {
        const newLocation = {
            name,
            category,
            address: address || '',
            description: description || '',
            contact: contact || {},
            coordinates: new admin.firestore.GeoPoint(parseFloat(latitude), parseFloat(longitude)),
            submittedBy: uid,
            approved: true, // Aprobación automática por ahora
            createdAt: new Date().toISOString(),
            averageRating: 0,
            ratingCount: 0,
            gallery: []
        };
        const docRef = await db.collection('locations').add(newLocation);
        res.status(201).json({ message: '¡Gracias por tu aporte! El lugar ha sido añadido al mapa.', locationId: docRef.id });
    } catch (error) {
        console.error('Error al crear un nuevo lugar:', error);
        res.status(500).json({ message: 'Error interno al crear el lugar.' });
    }
});
app.post('/api/locations/:locationId/review', async (req, res) => {
    const { uid } = req.user;
    const { locationId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Se requiere una calificación válida entre 1 y 5.' });
    }

    const locationRef = db.collection('locations').doc(locationId);
    const reviewRef = locationRef.collection('reviews').doc(uid);

    try {
        const userProfileDoc = await db.collection('users').doc(uid).get();
        if (!userProfileDoc.exists) {
            return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
        }
        const userProfile = userProfileDoc.data();

        await db.runTransaction(async (transaction) => {
            const locationDoc = await transaction.get(locationRef);
            if (!locationDoc.exists) {
                throw new Error("El lugar ya no existe.");
            }

            const newReview = {
                userId: uid,
                userName: userProfile.name,
                userProfilePic: userProfile.profilePictureUrl || '',
                rating,
                comment: comment || '',
                createdAt: new Date().toISOString()
            };
            transaction.set(reviewRef, newReview);

            const oldRatingCount = locationDoc.data().ratingCount || 0;
            const oldAverageRating = locationDoc.data().averageRating || 0;
            const newRatingCount = oldRatingCount + 1;
            const newAverageRating = ((oldAverageRating * oldRatingCount) + rating) / newRatingCount;

            transaction.update(locationRef, {
                ratingCount: newRatingCount,
                averageRating: newAverageRating
            });
        });

        res.status(201).json({ message: 'Reseña añadida con éxito.' });
    } catch (error) {
        console.error(`Error al añadir reseña a ${locationId}:`, error);
        res.status(500).json({ message: 'Error interno al procesar la reseña.' });
    }
});

// --- Endpoint del Feed Híbrido ---
app.get('/api/feed', async (req, res) => {
    const { uid } = req.user;
    const { cursor } = req.query;
    const POSTS_PER_PAGE = 10;
    const FOLLOWED_POSTS_RATIO = 0.7; // 70% de posts de seguidos

    try {
        const followingSnapshot = await db.collection('users').doc(uid).collection('following').get();
        const followedIds = followingSnapshot.docs.map(doc => doc.id);
        const authorsToInclude = [...new Set([...followedIds, uid])];

        let followedPosts = [];
        if (authorsToInclude.length > 0) {
            let followedQuery = db.collection('posts').where('authorId', 'in', authorsToInclude).orderBy('createdAt', 'desc');
            if (cursor) {
                followedQuery = followedQuery.startAfter(new Date(cursor));
            }
            const limit = Math.ceil(POSTS_PER_PAGE * FOLLOWED_POSTS_RATIO);
            const followedSnapshot = await followedQuery.limit(limit).get();
            followedPosts = followedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        const discoveryLimit = POSTS_PER_PAGE - followedPosts.length;
        let discoveryPosts = [];
        if (discoveryLimit > 0) {
            let discoveryQuery = db.collection('posts').orderBy('createdAt', 'desc');
            const discoverySnapshot = await discoveryQuery.limit(20).get(); // Traemos más para poder filtrar
            discoveryPosts = discoverySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(post => !authorsToInclude.includes(post.authorId)) // Excluimos los que ya vemos
                .slice(0, discoveryLimit); // Aplicamos el límite final
        }

        let combinedPosts = [...followedPosts, ...discoveryPosts];
        combinedPosts.sort(() => Math.random() - 0.5);

        const authorIds = [...new Set(combinedPosts.map(p => p.authorId))];
        const authorsData = {};
        if (authorIds.length > 0) {
            const authorPromises = authorIds.map(id => db.collection('users').doc(id).get().then(doc => doc.exists ? doc : db.collection('pets').doc(id).get()));
            const authorSnapshots = await Promise.all(authorPromises);
            authorSnapshots.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    authorsData[doc.id] = { id: doc.id, name: data.name, profilePictureUrl: data.profilePictureUrl || data.petPictureUrl || '' };
                }
            });
        }

        const finalPosts = combinedPosts.map(post => ({ ...post, author: authorsData[post.authorId] || { name: 'Autor Desconocido' } }));
        const nextCursor = finalPosts.length > 0 ? finalPosts[finalPosts.length - 1].createdAt : null;
        
        res.status(200).json({ posts: finalPosts, nextCursor });
    } catch (error) {
        console.error('Error en GET /api/feed:', error);
        res.status(500).json({ message: 'Error al obtener el feed.' });
    }
});

// --- Endpoints para el Módulo de Eventos ---

app.get('/api/event-categories', async (req, res) => {
    try {
        const categoriesSnapshot = await db.collection('event_categories').where('isOfficial', '==', true).get();
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error al obtener categorías de eventos:', error);
        res.status(500).json({ message: 'Error interno al obtener las categorías.' });
    }
});

// [CORRECCIÓN] Endpoint de eventos con lógica de estado dinámica y vistas de finalizados/cancelados
app.get('/api/events', async (req, res) => {
    const { view } = req.query; // 'finished', 'cancelled', o por defecto
    try {
        let query = db.collection('events').orderBy('startDate', 'asc');
        const eventsSnapshot = await query.get();
        const now = new Date();
        
        const events = eventsSnapshot.docs.map(doc => {
            const event = { id: doc.id, ...doc.data() };
            
            // [CORRECCIÓN] Respetar estados finales (finished y cancelled)
            if (event.status === 'cancelled' || event.status === 'finished') {
                return event;
            }

            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);

            let calculatedStatus = 'planned';
            if (now >= startDate && now <= endDate) {
                calculatedStatus = 'active';
            } else if (now > endDate) {
                // Si el tiempo ya pasó, se considera finalizado automáticamente.
                // No se guarda en BD para no sobrescribir un estado manual.
                calculatedStatus = 'finished';
            }
            
            return { ...event, status: calculatedStatus };
        });

        if (view === 'finished') {
            const finishedEvents = events.filter(e => e.status === 'finished');
            res.status(200).json(finishedEvents);
        } else if (view === 'cancelled') {
            const cancelledEvents = events.filter(e => e.status === 'cancelled');
            res.status(200).json(cancelledEvents);
        } else {
            const currentEvents = events.filter(e => e.status === 'planned' || e.status === 'active');
            res.status(200).json(currentEvents);
        }
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ message: 'Error interno al obtener los eventos.' });
    }
});

app.get('/api/events/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ message: 'Evento no encontrado.' });
        }
        const event = { id: eventDoc.id, ...eventDoc.data() };
        
        // [CORRECCIÓN] Respetar estados finales también en la vista de detalle
        if (event.status !== 'cancelled' && event.status !== 'finished') {
            const now = new Date();
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            if (now >= startDate && now <= endDate) event.status = 'active';
            else if (now > endDate) event.status = 'finished';
            else event.status = 'planned';
        }

        res.status(200).json(event);
    } catch (error) {
        console.error(`Error al obtener detalles del evento ${eventId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener los detalles del evento.' });
    }
});

app.post('/api/events', upload.single('coverImage'), async (req, res) => {
    const { uid } = req.user;
    const { name, description, category, startDate, endDate, locationId, customAddress, customLat, customLng, contactPhone, contactEmail } = req.body;

    if (!name || !category || !startDate || !endDate || !req.file) {
        return res.status(400).json({ message: 'Nombre, categoría, fechas y una imagen de portada son requeridos.' });
    }

    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'No se pudo encontrar el perfil del organizador.' });
        }
        const organizerName = userDoc.data().name;

        const eventRef = db.collection('events').doc();
        const filePath = `events/${eventRef.id}/${Date.now()}-${req.file.originalname}`;
        const fileUpload = bucket.file(filePath);
        const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });

        blobStream.on('error', (error) => {
            console.error("Error en la subida de la imagen del evento:", error);
            return res.status(500).json({ message: 'Error durante la subida de la imagen.' });
        });

        blobStream.on('finish', async () => {
            try {
                await fileUpload.makePublic();
                const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

                const now = new Date();
                const eventStartDate = new Date(startDate);
                // [CORRECCIÓN] El estado inicial se calcula en base a la fecha de inicio convertida
                const initialStatus = now >= eventStartDate ? 'active' : 'planned';

                const newEvent = {
                    name,
                    description,
                    coverImage: imageUrl,
                    organizerId: uid,
                    organizerName,
                    category,
                    status: initialStatus,
                    // [CORRECCIÓN] Se guardan directamente los strings ISO 8601 UTC recibidos del frontend
                    startDate: startDate,
                    endDate: endDate,
                    contact: { phone: contactPhone || '', email: contactEmail || '' },
                    createdAt: new Date().toISOString(),
                };

                if (locationId) {
                    newEvent.locationId = locationId;
                } else if (customLat && customLng) {
                    newEvent.customLocation = {
                        address: customAddress || '',
                        coordinates: new admin.firestore.GeoPoint(parseFloat(customLat), parseFloat(customLng))
                    };
                } else {
                    return res.status(400).json({ message: 'Se requiere una ubicación.' });
                }

                await eventRef.set(newEvent);
                res.status(201).json({ message: '¡Evento creado con éxito!', eventId: eventRef.id });
            } catch (error) {
                console.error("Error al guardar el evento en Firestore:", error);
                return res.status(500).json({ message: 'Error al guardar el evento.' });
            }
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error al crear un nuevo evento:', error);
        res.status(500).json({ message: 'Error interno al crear el evento.' });
    }
});

app.put('/api/events/:eventId/status', async (req, res) => {
    const { uid } = req.user;
    const { eventId } = req.params;
    const { status } = req.body;

    if (!status || !['planned', 'active', 'finished', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Se requiere un estado válido.' });
    }

    const eventRef = db.collection('events').doc(eventId);
    try {
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            return res.status(404).json({ message: 'Evento no encontrado.' });
        }
        if (eventDoc.data().organizerId !== uid) {
            return res.status(403).json({ message: 'No autorizado para modificar este evento.' });
        }

        await eventRef.update({ status });
        res.status(200).json({ message: `El estado del evento ha sido actualizado a: ${status}` });

    } catch (error) {
        console.error(`Error al actualizar el evento ${eventId}:`, error);
        res.status(500).json({ message: 'Error interno al actualizar el evento.' });
    }
});

app.put('/api/events/:eventId/details', upload.single('coverImage'), async (req, res) => {
    const { uid } = req.user;
    const { eventId } = req.params;
    const updateData = req.body;

    const eventRef = db.collection('events').doc(eventId);
    try {
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            return res.status(404).json({ message: 'Evento no encontrado.' });
        }
        
        const eventData = eventDoc.data();
        if (eventData.organizerId !== uid) {
            return res.status(403).json({ message: 'No autorizado para modificar este evento.' });
        }

        const oneHourInMs = 60 * 60 * 1000;
        const createdAt = new Date(eventData.createdAt).getTime();
        if (Date.now() - createdAt > oneHourInMs) {
            return res.status(403).json({ message: 'El período de edición de 1 hora ha expirado.' });
        }

        const allowedUpdates = {
            name: updateData.name,
            description: updateData.description,
            category: updateData.category,
            startDate: new Date(updateData.startDate).toISOString(),
            endDate: new Date(updateData.endDate).toISOString(),
        };

        if (updateData.customLat && updateData.customLng) {
            allowedUpdates.customLocation = {
                address: updateData.customAddress || '',
                coordinates: new admin.firestore.GeoPoint(parseFloat(updateData.customLat), parseFloat(updateData.customLng))
            };
        }

        if (req.file) {
            const filePath = `events/${eventId}/${Date.now()}-${req.file.originalname}`;
            const fileUpload = bucket.file(filePath);
            await fileUpload.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
            await fileUpload.makePublic();
            allowedUpdates.coverImage = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        }

        await eventRef.update(allowedUpdates);
        res.status(200).json({ message: 'Los detalles del evento han sido actualizados.' });

    } catch (error) {
        console.error(`Error al actualizar detalles del evento ${eventId}:`, error);
        res.status(500).json({ message: 'Error interno al actualizar los detalles.' });
    }
});

// ... (endpoints de follow, etc. sin cambios)
app.post('/api/profiles/:profileId/follow', async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params; 
    const { profileType } = req.body; 

    if (uid === profileId) {
        return res.status(400).json({ message: 'No puedes seguirte a ti mismo.' });
    }
    if (!profileType || !['pet', 'user'].includes(profileType)) {
        return res.status(400).json({ message: 'Se requiere un tipo de perfil válido (pet/user).' });
    }

    const currentUserRef = db.collection('users').doc(uid);
    const followedProfileRef = db.collection(profileType === 'pet' ? 'pets' : 'users').doc(profileId);

    try {
        await db.runTransaction(async (t) => {
            const followedDoc = await t.get(followedProfileRef);
            if (!followedDoc.exists) {
                throw new Error("El perfil que intentas seguir no existe.");
            }
            t.set(currentUserRef.collection('following').doc(profileId), { 
                followedAt: new Date(),
                type: profileType 
            });
            t.set(followedProfileRef.collection('followers').doc(uid), { 
                followedAt: new Date() 
            });
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
    const { profileType } = req.body; 

    if (!profileType || !['pet', 'user'].includes(profileType)) {
        return res.status(400).json({ message: 'Se requiere un tipo de perfil válido (pet/user).' });
    }

    const currentUserRef = db.collection('users').doc(uid);
    const followedProfileRef = db.collection(profileType === 'pet' ? 'pets' : 'users').doc(profileId);

    try {
        await db.runTransaction(async (t) => {
            t.delete(currentUserRef.collection('following').doc(profileId));
            t.delete(followedProfileRef.collection('followers').doc(uid));
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

// --- Iniciar Servidor ---
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
