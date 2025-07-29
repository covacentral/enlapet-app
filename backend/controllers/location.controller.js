// backend/controllers/location.controller.js
// Lógica de negocio para el mapa comunitario y sus lugares (Versión Corregida).

const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Obtiene las categorías de lugares oficiales.
 */
const getLocationCategories = async (req, res) => {
    try {
        const categoriesSnapshot = await db.collection('location_categories').where('isOfficial', '==', true).get();
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error en getLocationCategories:', error);
        res.status(500).json({ message: 'Error interno al obtener las categorías.' });
    }
};

/**
 * Obtiene los lugares aprobados, con filtro opcional por categoría.
 */
const getLocations = async (req, res) => {
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
        console.error('Error en getLocations:', error);
        res.status(500).json({ message: 'Error interno al obtener los lugares.' });
    }
};

/**
 * [NUEVO] Obtiene los detalles de un lugar específico, incluyendo sus reseñas.
 */
const getLocationDetails = async (req, res) => {
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
        console.error(`Error en getLocationDetails para ${locationId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener los detalles del lugar.' });
    }
};

/**
 * Crea un nuevo lugar enviado por un usuario.
 */
const createLocation = async (req, res) => {
    const { uid } = req.user;
    const { name, category, address, latitude, longitude, description, contact } = req.body;

    if (!name || !category || !latitude || !longitude) {
        return res.status(400).json({ message: 'Nombre, categoría y coordenadas son requeridos.' });
    }

    try {
        const newLocation = {
            name, category,
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
        console.error('Error en createLocation:', error);
        res.status(500).json({ message: 'Error interno al crear el lugar.' });
    }
};

/**
 * Añade una reseña a un lugar específico.
 */
const addReviewToLocation = async (req, res) => {
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
            if (!locationDoc.exists) throw new Error("El lugar ya no existe.");

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
        console.error(`Error en addReviewToLocation para ${locationId}:`, error);
        res.status(500).json({ message: 'Error interno al procesar la reseña.' });
    }
};

module.exports = {
    getLocationCategories,
    getLocations,
    getLocationDetails, // Exportamos la nueva función
    createLocation,
    addReviewToLocation
};