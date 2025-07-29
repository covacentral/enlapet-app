// backend/controllers/post.controller.js

const { db, storage, admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// --- Controlador para crear una nueva publicación ---
const createPost = async (req, res) => {
  try {
    const { uid: authorId } = req.user;
    const { text, authorType, profileId } = req.body; // authorType: 'user' o 'pet'

    if (!text || !authorType || !profileId) {
      return res.status(400).json({ message: 'Faltan datos para crear el post.' });
    }

    let imageUrl = null;

    // 1. Manejar la subida de la imagen si existe
    if (req.file) {
      const bucket = storage;
      const filename = `${authorId}/${uuidv4()}-${req.file.originalname}`;
      const file = bucket.file(filename);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // Hacemos el archivo público para obtener la URL
      await file.makePublic();
      imageUrl = file.publicUrl();
    }

    // 2. Crear el documento del post en Firestore
    const newPost = {
      authorId: profileId, // ID del perfil que publica (puede ser un usuario o una mascota)
      realAuthorId: authorId, // ID del usuario que realmente crea el post
      authorType,
      text,
      imageUrl,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
    };

    const docRef = await db.collection('posts').add(newPost);
    res.status(201).json({ message: 'Post creado exitosamente', id: docRef.id, ...newPost });

  } catch (error) {
    console.error('Error al crear el post:', error);
    res.status(500).json({ message: 'Error del servidor al crear el post.' });
  }
};

// --- Controlador para dar "like" a un post ---
const likePost = async (req, res) => {
  try {
    const { uid: userId } = req.user;
    const { postId } = req.params;

    const postRef = db.collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(userId);

    await db.runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      if (likeDoc.exists) {
        // El usuario ya ha dado like, no hacemos nada.
        return;
      }
      transaction.set(likeRef, { createdAt: new Date().toISOString() });
      transaction.update(postRef, { likesCount: admin.firestore.FieldValue.increment(1) });
    });

    res.status(200).json({ message: 'Like añadido.' });
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// --- Controlador para quitar el "like" de un post ---
const unlikePost = async (req, res) => {
  try {
    const { uid: userId } = req.user;
    const { postId } = req.params;

    const postRef = db.collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(userId);

    await db.runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      if (!likeDoc.exists) {
        // El usuario no ha dado like, no hacemos nada.
        return;
      }
      transaction.delete(likeRef);
      transaction.update(postRef, { likesCount: admin.firestore.FieldValue.increment(-1) });
    });

    res.status(200).json({ message: 'Like quitado.' });
  } catch (error) {
    console.error('Error al quitar like:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// --- Controlador para añadir un comentario ---
const addComment = async (req, res) => {
    // Lógica para añadir un comentario...
    res.status(201).json({ message: 'Comentario añadido (lógica pendiente).' });
};

// --- Controlador para obtener comentarios ---
const getComments = async (req, res) => {
    // Lógica para obtener comentarios...
    res.status(200).json({ message: 'Comentarios obtenidos (lógica pendiente).' });
};

// --- Controlador para seguir a un perfil ---
const followProfile = async (req, res) => {
  const { uid: followerId } = req.user; // Quien sigue
  const { profileId: followingId } = req.params; // A quien se sigue

  if (followerId === followingId) {
    return res.status(400).json({ message: 'No puedes seguirte a ti mismo.' });
  }

  const followerRef = db.collection('users').doc(followerId);
  const followingRef = db.collection('users').doc(followingId); // Asumimos que es un usuario por ahora

  try {
    await db.runTransaction(async (t) => {
      // 1. Añadir el ID del seguido a la subcolección 'following' del seguidor.
      t.set(followerRef.collection('following').doc(followingId), { createdAt: new Date() });
      // 2. Añadir el ID del seguidor a la subcolección 'followers' del seguido.
      t.set(followingRef.collection('followers').doc(followerId), { createdAt: new Date() });
      // 3. Incrementar contadores (opcional, pero útil)
      t.update(followerRef, { followingCount: admin.firestore.FieldValue.increment(1) });
      t.update(followingRef, { followersCount: admin.firestore.FieldValue.increment(1) });
    });
    res.status(200).json({ message: 'Ahora estás siguiendo a este perfil.' });
  } catch (error) {
    console.error("Error en la transacción de seguir:", error);
    res.status(500).json({ message: "No se pudo completar la acción de seguir." });
  }
};

// --- Controlador para dejar de seguir a un perfil ---
const unfollowProfile = async (req, res) => {
    const { uid: followerId } = req.user;
    const { profileId: followingId } = req.params;

    const followerRef = db.collection('users').doc(followerId);
    const followingRef = db.collection('users').doc(followingId);

    try {
        await db.runTransaction(async (t) => {
            t.delete(followerRef.collection('following').doc(followingId));
            t.delete(followingRef.collection('followers').doc(followerId));
            t.update(followerRef, { followingCount: admin.firestore.FieldValue.increment(-1) });
            t.update(followingRef, { followersCount: admin.firestore.FieldValue.increment(-1) });
        });
        res.status(200).json({ message: 'Has dejado de seguir a este perfil.' });
    } catch (error) {
        console.error("Error en la transacción de dejar de seguir:", error);
        res.status(500).json({ message: "No se pudo completar la acción." });
    }
};

module.exports = {
  createPost,
  likePost,
  unlikePost,
  addComment,
  getComments,
  followProfile,
  unfollowProfile,
};
