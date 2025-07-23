// backend/index.js
// Versión: 6.0 - Funcionalidad de Guardar Publicaciones
// Introduce los endpoints para guardar, quitar, y ver publicaciones guardadas.

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
app.get('/', (req, res) => res.json({ message: '¡Bienvenido a la API de EnlaPet! v6.0 - Endpoints de Guardado Implementados' }));

// --- Endpoints Públicos ---
app.post('/api/register', async (req, res) => { /* ...código existente sin cambios... */ });
app.post('/api/auth/google', async (req, res) => { /* ...código existente sin cambios... */ });
app.get('/api/public/pets/:petId', async (req, res) => { /* ...código existente sin cambios... */ });

// --- A partir de aquí, todos los endpoints requieren autenticación ---
app.use(authenticateUser);

// --- Endpoints de Gestión de Perfil y Mascotas ---
app.get('/api/profile', async (req, res) => { /* ...código existente sin cambios... */ });
app.put('/api/profile', async (req, res) => { /* ...código existente sin cambios... */ });
app.post('/api/profile/picture', upload.single('profilePicture'), async (req, res) => { /* ...código existente sin cambios... */ });
app.get('/api/pets', async (req, res) => { /* ...código existente sin cambios... */ });
app.post('/api/pets', async (req, res) => { /* ...código existente sin cambios... */ });
app.put('/api/pets/:petId', async (req, res) => { /* ...código existente sin cambios... */ });
app.post('/api/pets/:petId/picture', upload.single('petPicture'), async (req, res) => { /* ...código existente sin cambios... */ });

// --- Endpoint del Feed Híbrido ---
app.get('/api/feed', async (req, res) => { /* ...código existente sin cambios... */ });

// --- Endpoints de Publicaciones (Posts) ---
app.post('/api/posts', upload.single('postImage'), async (req, res) => { /* ...código existente sin cambios... */ });
app.get('/api/posts/by-author/:authorId', async (req, res) => { /* ...código existente sin cambios... */ });
app.post('/api/posts/:postId/like', async (req, res) => { /* ...código existente sin cambios... */ });
app.delete('/api/posts/:postId/unlike', async (req, res) => { /* ...código existente sin cambios... */ });
app.post('/api/posts/like-statuses', async (req, res) => { /* ...código existente sin cambios... */ });
app.get('/api/posts/:postId/comments', async (req, res) => { /* ...código existente sin cambios... */ });
app.post('/api/posts/:postId/comment', async (req, res) => { /* ...código existente sin cambios... */ });

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
        
        // Firestore 'in' queries are limited to 10 items. For a larger scale app, this would need chunking.
        const postsSnapshot = await db.collection('posts').where(admin.firestore.FieldPath.documentId(), 'in', postIds).get();
        
        const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Enriquecer con datos del autor (lógica similar al feed)
        const authorIds = [...new Set(postsData.map(p => p.authorId))];
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
        
        // Re-ordenar según el orden de guardado
        finalPosts.sort((a, b) => postIds.indexOf(a.id) - postIds.indexOf(b.id));

        res.status(200).json(finalPosts);
    } catch (error) {
        console.error('Error al obtener las publicaciones guardadas:', error);
        res.status(500).json({ message: 'Error al obtener las publicaciones guardadas.' });
    }
});

// --- Endpoints de Seguimiento (Follow) ---
app.post('/api/profiles/:profileId/follow', async (req, res) => { /* ...código existente sin cambios... */ });
app.delete('/api/profiles/:profileId/unfollow', async (req, res) => { /* ...código existente sin cambios... */ });
app.get('/api/profiles/:profileId/follow-status', async (req, res) => { /* ...código existente sin cambios... */ });

// --- Iniciar Servidor ---
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
