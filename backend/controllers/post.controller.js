// backend/controllers/post.controller.js
// Lógica de negocio para publicaciones.
// VERSIÓN CORREGIDA: Arregla el sistema de notificaciones para posts de mascotas.

const { db, bucket } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

// ... (Las funciones getFeed, createPost, getPostsByAuthor no cambian) ...
const getFeed = async (req, res) => {
    const { uid } = req.user;
    const { cursor } = req.query;
    const POSTS_PER_PAGE = 10;
    try {
        const followingSnapshot = await db.collection('users').doc(uid).collection('following').get();
        const followedIds = followingSnapshot.docs.map(doc => doc.id);
        const authorsToInclude = [...new Set([...followedIds, uid])];
        let posts = [];
        const fetchedPostIds = new Set();
        if (authorsToInclude.length > 0) {
            let followedQuery = db.collection('posts').where('authorId', 'in', authorsToInclude).orderBy('createdAt', 'desc').limit(POSTS_PER_PAGE);
            if (cursor) {
                const cursorDoc = await db.collection('posts').doc(cursor).get();
                if(cursorDoc.exists) followedQuery = followedQuery.startAfter(cursorDoc);
            }
            const followedSnapshot = await followedQuery.get();
            followedSnapshot.docs.forEach(doc => {
                if (!fetchedPostIds.has(doc.id)) {
                    posts.push({ id: doc.id, ...doc.data() });
                    fetchedPostIds.add(doc.id);
                }
            });
        }
        const remainingLimit = POSTS_PER_PAGE - posts.length;
        if (remainingLimit > 0) {
            let discoveryQuery = db.collection('posts').orderBy('createdAt', 'desc').limit(remainingLimit + 5);
            const discoverySnapshot = await discoveryQuery.get();
            discoverySnapshot.docs.forEach(doc => {
                if (posts.length < POSTS_PER_PAGE && !fetchedPostIds.has(doc.id)) {
                    posts.push({ id: doc.id, ...doc.data() });
                    fetchedPostIds.add(doc.id);
                }
            });
        }
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (posts.length > POSTS_PER_PAGE) posts = posts.slice(0, POSTS_PER_PAGE);
        const nextCursor = posts.length > 0 ? posts[posts.length - 1].id : null;
        const authorIds = [...new Set(posts.map(p => p.authorId))];
        const authorsData = {};
        if (authorIds.length > 0) {
            const authorPromises = authorIds.map(id => 
                db.collection('users').doc(id).get().then(doc => doc.exists ? doc : db.collection('pets').doc(id).get())
            );
            const authorSnapshots = await Promise.all(authorPromises);
            authorSnapshots.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    authorsData[doc.id] = { id: doc.id, name: data.name, profilePictureUrl: data.profilePictureUrl || data.petPictureUrl || '' };
                }
            });
        }
        const finalPosts = posts.map(post => ({ ...post, author: authorsData[post.authorId] || { id: post.authorId, name: 'Autor Desconocido' } }));
        res.status(200).json({ posts: finalPosts, nextCursor });
    } catch (error) {
        console.error('Error en getFeed:', error);
        res.status(500).json({ message: 'Error al obtener el feed.' });
    }
};
const createPost = async (req, res) => {
    const { uid } = req.user;
    const { caption, authorId, authorType } = req.body;
    if (!req.file || !caption || !authorId || !authorType) return res.status(400).json({ message: 'Imagen, texto, ID y tipo de autor son requeridos.' });
    const authorCollection = authorType === 'pet' ? 'pets' : 'users';
    const authorRef = db.collection(authorCollection).doc(authorId);
    try {
        const authorDoc = await authorRef.get();
        if (!authorDoc.exists) return res.status(404).json({ message: 'Autor no encontrado.' });
        if (authorType === 'pet' && authorDoc.data().ownerId !== uid) return res.status(403).json({ message: 'No autorizado.' });
        if (authorType === 'user' && authorId !== uid) return res.status(403).json({ message: 'No autorizado.' });
        const authorData = authorDoc.data();
        const postRef = db.collection('posts').doc();
        const filePath = `posts/${uid}/${postRef.id}/${Date.now()}-${req.file.originalname}`;
        const fileUpload = bucket.file(filePath);
        const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });
        blobStream.on('error', (error) => {
            console.error("Error en blobStream (post):", error);
            res.status(500).json({ message: 'Error durante la subida de la imagen.' });
        });
        blobStream.on('finish', async () => {
            await fileUpload.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            const newPost = { authorId, authorType, imageUrl, caption, authorLocation: authorData.location || null, createdAt: new Date().toISOString(), likesCount: 0, commentsCount: 0 };
            await postRef.set(newPost);
            const finalPost = { ...newPost, id: postRef.id, author: { id: authorId, name: authorData.name, profilePictureUrl: authorData.profilePictureUrl || authorData.petPictureUrl || '' } };
            res.status(201).json({ message: 'Publicación creada.', post: finalPost });
        });
        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error al crear el post:', error);
        res.status(500).json({ message: 'Error al verificar el autor.' });
    }
};
const getPostsByAuthor = async (req, res) => {
    try {
        const { authorId } = req.params;
        const postsQuery = await db.collection('posts').where('authorId', '==', authorId).orderBy('createdAt', 'desc').get();
        const posts = postsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(posts);
    } catch (error) {
        console.error(`Error en getPostsByAuthor para ${req.params.authorId}:`, error);
        res.status(500).json({ message: 'Error al obtener las publicaciones.' });
    }
};

/**
 * Da "like" a una publicación.
 */
const likePost = async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    const postRef = db.collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(uid);

    try {
        let recipientId = null; // Variable para guardar el ID del dueño de la mascota

        await db.runTransaction(async (t) => {
            const postDoc = await t.get(postRef);
            if (!postDoc.exists) throw new Error("Publicación no encontrada.");

            const likeDoc = await t.get(likeRef);
            if (likeDoc.exists) {
                recipientId = 'ALREADY_LIKED'; // Usamos un flag para no enviar notificación
                return;
            }
            
            const postData = postDoc.data();
            recipientId = postData.authorId; // Por defecto, el autor es el destinatario

            // Si el autor es una mascota, buscamos a su dueño
            if (postData.authorType === 'pet') {
                const petDoc = await t.get(db.collection('pets').doc(postData.authorId));
                if (petDoc.exists) {
                    recipientId = petDoc.data().ownerId; // El destinatario es el dueño
                } else {
                    recipientId = null; // La mascota fue eliminada, no se puede notificar
                }
            }
            
            t.set(likeRef, { createdAt: new Date().toISOString() });
            t.update(postRef, { likesCount: admin.firestore.FieldValue.increment(1) });
        });

        // Enviamos la notificación DESPUÉS de que la transacción sea exitosa
        if (recipientId && recipientId !== 'ALREADY_LIKED') {
            await createNotification(recipientId, uid, 'new_like', postId, 'post');
        }
        
        res.status(200).json({ message: 'Like añadido.' });
    } catch (error) {
        console.error('Error en likePost:', error);
        res.status(500).json({ message: 'No se pudo registrar el like.' });
    }
};

// ... (La función unlikePost no cambia) ...
const unlikePost = async (req, res) => {
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
        console.error('Error en unlikePost:', error);
        res.status(500).json({ message: 'No se pudo quitar el like.' });
    }
};
// ... (La función getLikeStatuses no cambia) ...
const getLikeStatuses = async (req, res) => {
    const { uid } = req.user;
    const { postIds } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) return res.status(200).json({});
    try {
        const likePromises = postIds.map(postId => db.collection('posts').doc(postId).collection('likes').doc(uid).get());
        const likeSnapshots = await Promise.all(likePromises);
        const statuses = {};
        likeSnapshots.forEach((doc, index) => { statuses[postIds[index]] = doc.exists; });
        res.status(200).json(statuses);
    } catch (error) {
        console.error('Error en getLikeStatuses:', error);
        res.status(500).json({ message: 'Error al verificar likes.' });
    }
};

/**
 * Crea un comentario en una publicación.
 */
const addComment = async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ message: 'El comentario no puede estar vacío.' });

    const postRef = db.collection('posts').doc(postId);
    const commentRef = postRef.collection('comments').doc();

    try {
        let recipientId = null;
        let newComment = null;

        await db.runTransaction(async (t) => {
            const postDoc = await t.get(postRef);
            if (!postDoc.exists) throw new Error("Publicación no encontrada.");

            const userProfileDoc = await t.get(db.collection('users').doc(uid));
            if (!userProfileDoc.exists) throw new Error("Perfil de usuario no encontrado.");
            const userProfile = userProfileDoc.data();

            newComment = {
                id: commentRef.id, text, postId, authorId: uid,
                authorName: userProfile.name,
                authorProfilePic: userProfile.profilePictureUrl || '',
                createdAt: new Date().toISOString()
            };
            
            const postData = postDoc.data();
            recipientId = postData.authorId;

            if (postData.authorType === 'pet') {
                const petDoc = await t.get(db.collection('pets').doc(postData.authorId));
                if (petDoc.exists) {
                    recipientId = petDoc.data().ownerId;
                } else {
                    recipientId = null;
                }
            }
            
            t.set(commentRef, newComment);
            t.update(postRef, { commentsCount: admin.firestore.FieldValue.increment(1) });
        });

        if (recipientId) {
            await createNotification(recipientId, uid, 'new_comment', postId, 'post');
        }

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error en addComment:', error);
        res.status(500).json({ message: 'No se pudo publicar el comentario.' });
    }
};

// ... (El resto de funciones: getComments, savePost, unsavePost, getSaveStatuses, getSavedPosts no cambian) ...
const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const commentsQuery = await db.collection('posts').doc(postId).collection('comments').orderBy('createdAt', 'asc').get();
        const comments = commentsQuery.docs.map(doc => doc.data());
        res.status(200).json(comments);
    } catch (error) {
        console.error(`Error en getComments para ${req.params.postId}:`, error);
        res.status(500).json({ message: 'No se pudieron obtener los comentarios.' });
    }
};
const savePost = async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    try {
        const savedPostRef = db.collection('users').doc(uid).collection('saved_posts').doc(postId);
        await savedPostRef.set({ savedAt: new Date().toISOString() });
        res.status(200).json({ message: 'Publicación guardada.' });
    } catch (error) {
        console.error('Error en savePost:', error);
        res.status(500).json({ message: 'No se pudo guardar la publicación.' });
    }
};
const unsavePost = async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    try {
        const savedPostRef = db.collection('users').doc(uid).collection('saved_posts').doc(postId);
        await savedPostRef.delete();
        res.status(200).json({ message: 'Publicación eliminada de guardados.' });
    } catch (error) {
        console.error('Error en unsavePost:', error);
        res.status(500).json({ message: 'No se pudo quitar la publicación.' });
    }
};
const getSaveStatuses = async (req, res) => {
    const { uid } = req.user;
    const { postIds } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) return res.status(200).json({});
    try {
        const savedPostsRef = db.collection('users').doc(uid).collection('saved_posts');
        const promises = postIds.map(id => savedPostsRef.doc(id).get());
        const results = await Promise.all(promises);
        const statuses = {};
        results.forEach((doc, index) => { statuses[postIds[index]] = doc.exists; });
        res.status(200).json(statuses);
    } catch (error) {
        console.error('Error en getSaveStatuses:', error);
        res.status(500).json({ message: 'Error al verificar guardados.' });
    }
};
const getSavedPosts = async (req, res) => {
    const { uid } = req.user;
    try {
        const savedSnapshot = await db.collection('users').doc(uid).collection('saved_posts').orderBy('savedAt', 'desc').get();
        if (savedSnapshot.empty) return res.status(200).json([]);
        const postIds = savedSnapshot.docs.map(doc => doc.id);
        const postChunks = [];
        for (let i = 0; i < postIds.length; i += 30) {
            postChunks.push(postIds.slice(i, i + 30));
        }
        const postPromises = postChunks.map(chunk => db.collection('posts').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get());
        const chunkSnapshots = await Promise.all(postPromises);
        let postsData = [];
        chunkSnapshots.forEach(snap => {
            postsData = [...postsData, ...snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
        });
        const authorIds = [...new Set(postsData.map(p => p.authorId).filter(id => id))];
        const authorsData = {};
        if (authorIds.length > 0) {
            const authorPromises = authorIds.map(id => 
                db.collection('pets').doc(id).get().then(doc => doc.exists ? doc : db.collection('users').doc(id).get())
            );
            const authorSnapshots = await Promise.all(authorPromises);
            authorSnapshots.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    authorsData[doc.id] = { id: doc.id, name: data.name, profilePictureUrl: data.profilePictureUrl || data.petPictureUrl || ''};
                }
            });
        }
        let finalPosts = postsData.map(post => ({ ...post, author: authorsData[post.authorId] || { name: 'Autor Desconocido' } }));
        finalPosts.sort((a, b) => postIds.indexOf(a.id) - postIds.indexOf(b.id));
        res.status(200).json(finalPosts);
    } catch (error) {
        console.error(`Error en getSavedPosts para ${uid}:`, error);
        res.status(500).json({ message: 'Error al obtener publicaciones guardadas.' });
    }
};


module.exports = {
    getFeed, createPost, getPostsByAuthor, likePost, unlikePost, getLikeStatuses,
    addComment, getComments, savePost, unsavePost, getSaveStatuses, getSavedPosts
};