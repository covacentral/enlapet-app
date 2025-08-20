// backend/controllers/post.controller.js
// VERSIÓN 2.2: Integra el sistema de rescate en el feed principal.

const { db, bucket } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

/**
 * Obtiene el feed de publicaciones para el usuario y añade una lista de mascotas extraviadas.
 */
const getFeed = async (req, res) => {
    const { uid } = req.user;
    const { cursor } = req.query;
    const POSTS_PER_PAGE = 10;
    try {
        // --- Lógica de Publicaciones (sin cambios) ---
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

        // --- [NUEVA LÓGICA] Obtener mascotas en modo rescate ---
        // Solo lo hacemos en la primera carga del feed (cuando no hay cursor) para eficiencia.
        let rescuePetsData = [];
        if (!cursor) {
            const rescueSnapshot = await db.collection('pets')
                .where('rescueMode.isActive', '==', true)
                .orderBy('rescueMode.activatedAt', 'desc')
                .limit(5)
                .get();
            
            if (!rescueSnapshot.empty) {
                rescuePetsData = rescueSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        breed: data.breed,
                        petPictureUrl: data.petPictureUrl,
                        lastSeenAddress: data.rescueMode.lastSeen.address
                    };
                });
            }
        }

        // --- Respuesta Modificada ---
        res.status(200).json({
            posts: finalPosts,
            lostPets: rescuePetsData,
            nextCursor
        });

    } catch (error) {
        console.error('Error en getFeed:', error);
        res.status(500).json({ message: 'Error al obtener el feed.' });
    }
};


// --- (El resto de funciones como createPost, likePost, etc., no cambian) ---
const createPost = async (req, res) => {
    const { uid } = req.user;
    const { caption, authorId, authorType, missionId, petId } = req.body;

    if (!req.file || !caption || !authorId || !authorType) {
        return res.status(400).json({ message: 'Imagen, texto, ID y tipo de autor son requeridos.' });
    }

    try {
        const authorDoc = await db.collection(authorType === 'pet' ? 'pets' : 'users').doc(authorId).get();
        if (!authorDoc.exists || (authorType === 'pet' && authorDoc.data().ownerId !== uid) || (authorType === 'user' && authorId !== uid)) {
            return res.status(403).json({ message: 'Autorización denegada.' });
        }

        const postRef = db.collection('posts').doc();
        const filePath = `posts/${uid}/${postRef.id}/${Date.now()}-${req.file.originalname}`;
        const fileUpload = bucket.file(filePath);
        const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });

        blobStream.on('error', (error) => res.status(500).json({ message: 'Error durante la subida de la imagen.' }));

        blobStream.on('finish', async () => {
            await fileUpload.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

            try {
                const newPost = await db.runTransaction(async (t) => {
                    let missionDoc = null;
                    let completedMissionDoc = null;
                    if (missionId && petId) {
                        const missionRef = db.collection('missions').doc(missionId);
                        const completedMissionRef = db.collection('pets').doc(petId).collection('completedMissions').doc(missionId);
                        [missionDoc, completedMissionDoc] = await Promise.all([t.get(missionRef), t.get(completedMissionRef)]);
                    }
                    
                    let missionData = null;
                    let finalCaption = caption;
                    const isMissionPost = missionId && petId && missionDoc && missionDoc.exists && missionDoc.data().isActive && !completedMissionDoc.exists;

                    if (isMissionPost) {
                        missionData = { id: missionDoc.id, ...missionDoc.data() };
                        if (!finalCaption.includes(missionData.hashtag)) {
                            finalCaption = `${finalCaption} ${missionData.hashtag}`;
                        }
                    }
                    
                    const postData = {
                        authorId, authorType, imageUrl, caption: finalCaption,
                        authorLocation: authorDoc.data().location || null,
                        createdAt: new Date().toISOString(),
                        likesCount: 0, commentsCount: 0
                    };

                    t.set(postRef, postData);

                    if (isMissionPost) {
                        const userRef = db.collection('users').doc(uid);
                        const completedMissionRef = db.collection('pets').doc(petId).collection('completedMissions').doc(missionId);
                        
                        t.set(completedMissionRef, {
                            completedAt: new Date().toISOString(), status: 'completed',
                            proof: { type: 'POST', postId: postRef.id }
                        });
                        
                        t.update(userRef, {
                            enlaPetPoints: admin.firestore.FieldValue.increment(missionData.reward.points || 0)
                        });
                    }
                    
                    return { ...postData, id: postRef.id, isMissionCompleted: isMissionPost, missionData };
                });

                if (newPost.isMissionCompleted) {
                    await createNotification(uid, 'system', 'mission_completed', newPost.missionData.id, 'mission');
                }
                
                const finalAuthorData = { id: authorId, name: authorDoc.data().name, profilePictureUrl: authorDoc.data().profilePictureUrl || authorDoc.data().petPictureUrl || '' };
                res.status(201).json({ message: 'Publicación creada.', post: { ...newPost, author: finalAuthorData } });

            } catch (transactionError) {
                console.error('Error en la transacción de createPost:', transactionError);
                res.status(500).json({ message: transactionError.message || 'No se pudo crear la publicación y completar la misión.' });
            }
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error al preparar la creación del post:', error);
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

const likePost = async (req, res) => {
    const { uid } = req.user;
    const { postId } = req.params;
    const postRef = db.collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(uid);
    try {
        let recipientId = null;
        await db.runTransaction(async (t) => {
            const postDoc = await t.get(postRef);
            if (!postDoc.exists) throw new Error("Publicación no encontrada.");
            const likeDoc = await t.get(likeRef);
            if (likeDoc.exists) {
                recipientId = 'ALREADY_LIKED';
                return;
            }
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
            t.set(likeRef, { createdAt: new Date().toISOString() });
            t.update(postRef, { likesCount: admin.firestore.FieldValue.increment(1) });
        });
        if (recipientId && recipientId !== 'ALREADY_LIKED') {
            await createNotification(recipientId, uid, 'new_like', postId, 'post');
        }
        res.status(200).json({ message: 'Like añadido.' });
    } catch (error) {
        console.error('Error en likePost:', error);
        res.status(500).json({ message: 'No se pudo registrar el like.' });
    }
};

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
            newComment = { id: commentRef.id, text, postId, authorId: uid, authorName: userProfile.name, authorProfilePic: userProfile.profilePictureUrl || '', createdAt: new Date().toISOString() };
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

const getPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        const postDoc = await db.collection('posts').doc(postId).get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'La publicación no fue encontrada.' });
        }

        const postData = postDoc.data();
        let authorData = { id: postData.authorId, name: 'Autor Desconocido' };

        const authorCollection = postData.authorType === 'pet' ? 'pets' : 'users';
        const authorDoc = await db.collection(authorCollection).doc(postData.authorId).get();

        if (authorDoc.exists) {
            const data = authorDoc.data();
            authorData = {
                id: authorDoc.id,
                name: data.name,
                profilePictureUrl: data.profilePictureUrl || data.petPictureUrl || ''
            };
        }

        const finalPost = {
            ...postData,
            id: postDoc.id,
            author: authorData
        };

        res.status(200).json(finalPost);
    } catch (error) {
        console.error(`Error en getPostById para el post ${req.params.postId}:`, error);
        res.status(500).json({ message: 'Error al obtener la publicación.' });
    }
};

module.exports = {
    getFeed, createPost, getPostsByAuthor, likePost, unlikePost, getLikeStatuses,
    addComment, getComments, savePost, unsavePost, getSaveStatuses, getSavedPosts,
    getPostById
};