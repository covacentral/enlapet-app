// backend/controllers/pet.controller.js

const { db } = require('../config/firebase');

// --- Controlador para obtener las mascotas del usuario autenticado ---
const getUserPets = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Buscamos en la colección 'pets' todos los documentos
    // donde el campo 'ownerId' coincida con el ID del usuario autenticado.
    const petsSnapshot = await db.collection('pets').where('ownerId', '==', userId).get();

    // Mapeamos los resultados para devolver un array de objetos de mascota.
    const pets = petsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(pets);
  } catch (error) {
    console.error('Error al obtener las mascotas del usuario:', error);
    res.status(500).json({ message: 'Error del servidor al obtener las mascotas.' });
  }
};

// --- Controlador para crear una nueva mascota ---
const createPet = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, breed } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre de la mascota es requerido.' });
    }

    // Creamos la estructura inicial del documento de la mascota.
    const newPet = {
      ownerId: userId,
      name,
      breed: breed || '',
      createdAt: new Date().toISOString(),
      profilePictureUrl: null,
      coverPhotoUrl: null,
      // Añadimos objetos vacíos para futuras funcionalidades
      location: {},
      healthRecord: {},
      gallery: [],
    };

    const docRef = await db.collection('pets').add(newPet);

    res.status(201).json({ message: 'Mascota creada exitosamente.', id: docRef.id, ...newPet });
  } catch (error) {
    console.error('Error al crear la mascota:', error);
    res.status(500).json({ message: 'Error del servidor al crear la mascota.' });
  }
};

// --- Controlador para actualizar una mascota ---
const updatePet = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { petId } = req.params;
    const dataToUpdate = req.body;

    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) {
      return res.status(404).json({ message: 'Mascota no encontrada.' });
    }

    // Verificación de seguridad: Asegurarnos que el usuario que actualiza es el dueño.
    if (petDoc.data().ownerId !== userId) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta mascota.' });
    }

    await petRef.set(dataToUpdate, { merge: true });

    res.status(200).json({ message: 'Mascota actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la mascota:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar la mascota.' });
  }
};

// --- Controlador para obtener el perfil público de una mascota (NFC) ---
const getPublicPetProfile = async (req, res) => {
  try {
    const { petId } = req.params;
    const petDoc = await db.collection('pets').doc(petId).get();

    if (!petDoc.exists) {
      return res.status(404).json({ message: 'Perfil de mascota no encontrado.' });
    }

    const petData = petDoc.data();

    // Obtenemos los datos del dueño para mostrar su información de contacto.
    const ownerDoc = await db.collection('users').doc(petData.ownerId).get();
    
    let ownerInfo = { name: 'Información no disponible', phone: null };
    if (ownerDoc.exists) {
        ownerInfo.name = ownerDoc.data().name;
        // Aquí podríamos añadir lógica de privacidad en el futuro
        ownerInfo.phone = ownerDoc.data().phone || null;
    }

    // Creamos un objeto público solo con la información necesaria y segura.
    const publicPetProfile = {
      name: petData.name,
      breed: petData.breed,
      profilePictureUrl: petData.profilePictureUrl,
      owner: ownerInfo,
    };

    res.status(200).json(publicPetProfile);
  } catch (error) {
    console.error('Error al obtener el perfil público de la mascota:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};


module.exports = {
  getUserPets,
  createPet,
  updatePet,
  getPublicPetProfile,
};
