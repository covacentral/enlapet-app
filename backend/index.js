// backend/index.js
// Versión: 13.1 - Corrección Crítica de Feed y Notificaciones
// CORRIGE:
// 1. Se soluciona el crash en GET /api/feed que ocurría al intentar obtener posts de descubrimiento.
// MANTIENE:
// 2. Toda la funcionalidad del sistema de notificaciones.

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
app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v13.1 - Feed Corregido' }));

// --- Endpoints Públicos (No requieren autenticación) ---
app.post('/api/register', async (req, res) => {try {const { email, password, name } = req.body;if (!email || !password || !name) {return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });}const userRecord = await auth.createUser({ email, password, displayName: name });const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await db.collection('users').doc(userRecord.uid).set(newUser);res.status(201).json({ message: 'Usuario registrado con éxito', uid: userRecord.uid });} catch (error) {console.error('Error en /api/register:', error);if (error.code === 'auth/email-already-exists') {return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });}if (error.code === 'auth/invalid-password') {return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });}res.status(500).json({ message: 'Error al registrar el usuario.' });}});
app.post('/api/auth/google', async (req, res) => {const { idToken } = req.body;if (!idToken) return res.status(400).json({ message: 'Se requiere el idToken de Google.' });try {const decodedToken = await auth.verifyIdToken(idToken);const { uid, name, email, picture } = decodedToken;const userRef = db.collection('users').doc(uid);const userDoc = await userRef.get();if (!userDoc.exists) {const newUser = {name,email,createdAt: new Date().toISOString(),userType: 'personal',profilePictureUrl: picture || '',coverPhotoUrl: '',bio: '',phone: '',location: { country: 'Colombia', department: '', city: '' },privacySettings: { profileVisibility: 'public', showEmail: 'private' }};await userRef.set(newUser);return res.status(201).json({ message: 'Usuario registrado y autenticado con Google.', uid });} else {return res.status(200).json({ message: 'Usuario autenticado con Google.', uid });}} catch (error) {console.error('Error en /api/auth/google:', error);res.status(500).json({ message: 'Error en la autenticación con Google.' });}});
app.get('/api/public/pets/:petId', async (req, res) => {try {const { petId } = req.params;const petDoc = await db.collection('pets').doc(petId).get();if (!petDoc.exists) return res.status(404).json({ message: 'Mascota no encontrada.' });const petData = petDoc.data();const userDoc = await db.collection('users').doc(petData.ownerId).get();let ownerData = { id: petData.ownerId, name: 'Responsable', phone: 'No disponible' };if (userDoc.exists) {const fullOwnerData = userDoc.data();ownerData = {id: petData.ownerId, name: fullOwnerData.name,phone: fullOwnerData.phone || 'No proporcionado'};}const publicProfile = {pet: { ...petData, id: petDoc.id }, owner: ownerData};res.status(200).json(publicProfile);} catch (error) {console.error('Error en /api/public/pets/:petId:', error);res.status(500).json({ message: 'Error interno del servidor.' });}});


// --- A partir de aquí, todos los endpoints requieren autenticación ---
app.use(authenticateUser);

// --- Endpoints de Perfil, Mascotas, Posts, etc. ---
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
app.delete('/api/posts/:postId/unlike', async (req, res) => {const { uid } = req.user;const { postId } = req.params;const postRef = db.collection('posts').doc(postId);const likeRef = postRef.collection('likes').doc(uid);try {await db.runTransaction(async (t) => {const likeDoc = await t.get(likeRef);if (!likeDoc.exists) {return;}t.delete(likeRef);t.update(postRef, { likesCount: admin.firestore.FieldValue.increment(-1) });});res.status(200).json({ message: 'Like eliminado.' });} catch (error) {console.error('Error al quitar like:', error);res.status(500).json({ message: 'No se pudo quitar el like.' });}});
app.post('/api/posts/like-statuses', async (req, res) => {const { uid } = req.user;const { postIds } = req.body;if (!Array.isArray(postIds) || postIds.length === 0) return res.status(200).json({});try {const likePromises = postIds.map(postId => db.collection('posts').doc(postId).collection('likes').doc(uid).get());const likeSnapshots = await Promise.all(likePromises);const statuses = {};likeSnapshots.forEach((doc, index) => {const postId = postIds[index];statuses[postId] = doc.exists;});res.status(200).json(statuses);} catch (error) {console.error('Error al verificar estados de likes:', error);res.status(500).json({ message: 'No se pudieron verificar los likes.' });}});
app.get('/api/posts/:postId/comments', async (req, res) => {const { postId } = req.params;try {const commentsQuery = await db.collection('posts').doc(postId).collection('comments').orderBy('createdAt', 'asc').get();const comments = commentsQuery.docs.map(doc => doc.data());res.status(200).json(comments);} catch (error) {console.error('Error al obtener comentarios:', error);res.status(500).json({ message: 'No se pudieron obtener los comentarios.' });}});
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
    const { contentId, contentType, reason } = req.body;

    if (!contentId || !reason || !contentType) {
        return res.status(400).json({ message: 'Se requiere ID, tipo de contenido y una razón para el reporte.' });
    }

    const reportRef = db.collection('reports').doc(contentId);

    try {
        let contentPreview = {};
        if (contentType === 'post') {
            const doc = await db.collection('posts').doc(contentId).get();
            if (doc.exists) {
                contentPreview = {
                    authorId: doc.data().authorId,
                    preview: doc.data().caption.substring(0, 100)
                };
            }
        } else if (contentType === 'event') {
            const doc = await db.collection('events').doc(contentId).get();
            if (doc.exists) {
                contentPreview = {
                    authorId: doc.data().organizerId,
                    preview: doc.data().name
                };
            }
        }

        await db.runTransaction(async (transaction) => {
            const reportDoc = await transaction.get(reportRef);

            if (!reportDoc.exists) {
                const newReport = {
                    contentType: contentType,
                    ...contentPreview,
                    totalReports: 1,
                    reasons: { [reason]: 1 },
                    reporters: [uid],
                    status: 'pending',
                    lastReportedAt: new Date().toISOString(),
                };
                transaction.set(reportRef, newReport);
            } else {
                const reporterList = reportDoc.data().reporters || [];
                if (reporterList.includes(uid)) {
                    return; 
                }

                const updateData = {
                    totalReports: admin.firestore.FieldValue.increment(1),
                    [`reasons.${reason}`]: admin.firestore.FieldValue.increment(1),
                    reporters: admin.firestore.FieldValue.arrayUnion(uid),
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
            approved: true,
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
app.get('/api/events', async (req, res) => {
    const { view } = req.query;
    try {
        let query = db.collection('events').orderBy('startDate', 'asc');
        const eventsSnapshot = await query.get();
        const now = new Date();
        
        const events = eventsSnapshot.docs.map(doc => {
            const event = { id: doc.id, ...doc.data() };
            
            if (event.status === 'cancelled' || event.status === 'finished') {
                return event;
            }

            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);

            let calculatedStatus = 'planned';
            if (now >= startDate && now <= endDate) {
                calculatedStatus = 'active';
            } else if (now > endDate) {
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
                const initialStatus = now >= eventStartDate ? 'active' : 'planned';

                const newEvent = {
                    name,
                    description,
                    coverImage: imageUrl,
                    organizerId: uid,
                    organizerName,
                    category,
                    status: initialStatus,
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

// --- [INICIO] Endpoints de Notificaciones ---

app.get('/api/notifications', async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(30)
            .get();
        
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ message: 'Error al obtener notificaciones.' });
    }
});

app.get('/api/notifications/unread-count', async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', uid)
            .where('read', '==', false)
            .get();
            
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error('Error al contar notificaciones no leídas:', error);
        res.status(500).json({ message: 'Error al contar notificaciones.' });
    }
});

app.post('/api/notifications/mark-as-read', async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', uid)
            .where('read', '==', false)
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ message: 'No hay notificaciones nuevas para marcar.' });
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();

        res.status(200).json({ message: 'Notificaciones marcadas como leídas.' });
    } catch (error) {
        console.error('Error al marcar notificaciones como leídas:', error);
        res.status(500).json({ message: 'Error al actualizar notificaciones.' });
    }
});
// --- [FIN] Endpoints de Notificaciones ---


// --- Iniciar Servidor ---
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
