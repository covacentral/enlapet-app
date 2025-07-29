// backend/controllers/event.controller.js
// Lógica de negocio para la gestión de eventos de la comunidad (Versión Corregida).

const { db, bucket } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Obtiene las categorías de eventos oficiales.
 */
const getEventCategories = async (req, res) => {
    try {
        const categoriesSnapshot = await db.collection('event_categories').where('isOfficial', '==', true).get();
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error en getEventCategories:', error);
        res.status(500).json({ message: 'Error interno al obtener las categorías de eventos.' });
    }
};

/**
 * Obtiene una lista de eventos, con la opción de filtrar por estado.
 */
const getEvents = async (req, res) => {
    const { view } = req.query;
    try {
        let query = db.collection('events').orderBy('startDate', 'asc');
        const eventsSnapshot = await query.get();
        const now = new Date();
        
        const events = eventsSnapshot.docs.map(doc => {
            const event = { id: doc.id, ...doc.data() };
            if (event.status === 'cancelled' || event.status === 'finished') return event;

            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            let calculatedStatus = 'planned';
            if (now >= startDate && now <= endDate) calculatedStatus = 'active';
            else if (now > endDate) calculatedStatus = 'finished';
            
            return { ...event, status: calculatedStatus };
        });

        if (view === 'finished') {
            res.status(200).json(events.filter(e => e.status === 'finished'));
        } else if (view === 'cancelled') {
            res.status(200).json(events.filter(e => e.status === 'cancelled'));
        } else {
            res.status(200).json(events.filter(e => e.status === 'planned' || e.status === 'active'));
        }
    } catch (error) {
        console.error('Error en getEvents:', error);
        res.status(500).json({ message: 'Error interno al obtener los eventos.' });
    }
};

/**
 * Obtiene los detalles de un evento específico.
 */
const getEventDetails = async (req, res) => {
    const { eventId } = req.params;
    try {
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) return res.status(404).json({ message: 'Evento no encontrado.' });
        res.status(200).json({ id: eventDoc.id, ...eventDoc.data() });
    } catch (error) {
        console.error(`Error en getEventDetails para ${eventId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener los detalles.' });
    }
};

/**
 * Crea un nuevo evento.
 */
const createEvent = async (req, res) => {
    const { uid } = req.user;
    const { name, description, category, startDate, endDate, customAddress, customLat, customLng, contactPhone, contactEmail } = req.body;

    if (!name || !category || !startDate || !endDate || !req.file || !customLat || !customLng) {
        return res.status(400).json({ message: 'Todos los campos, incluyendo imagen y coordenadas, son requeridos.' });
    }

    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ message: 'Organizador no encontrado.' });
        const organizerName = userDoc.data().name;

        const eventRef = db.collection('events').doc();
        const filePath = `events/${eventRef.id}/${Date.now()}-${req.file.originalname}`;
        const fileUpload = bucket.file(filePath);
        const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });

        blobStream.on('error', (error) => res.status(500).json({ message: 'Error en la subida de la imagen.' }));

        blobStream.on('finish', async () => {
            await fileUpload.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            
            const newEvent = {
                name, description, category,
                startDate: new Date(startDate).toISOString(), 
                endDate: new Date(endDate).toISOString(),
                coverImage: imageUrl,
                organizerId: uid,
                organizerName,
                status: 'planned',
                contact: { phone: contactPhone || '', email: contactEmail || '' },
                customLocation: {
                    address: customAddress || '',
                    coordinates: new admin.firestore.GeoPoint(parseFloat(customLat), parseFloat(customLng))
                },
                createdAt: new Date().toISOString(),
            };

            await eventRef.set(newEvent);
            res.status(201).json({ message: '¡Evento creado con éxito!', eventId: eventRef.id });
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error en createEvent:', error);
        res.status(500).json({ message: 'Error interno al crear el evento.' });
    }
};

/**
 * Actualiza el estado de un evento (ej. cancelado).
 */
const updateEventStatus = async (req, res) => {
    const { uid } = req.user;
    const { eventId } = req.params;
    const { status } = req.body;

    if (!status || !['planned', 'active', 'finished', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Se requiere un estado válido.' });
    }

    const eventRef = db.collection('events').doc(eventId);
    try {
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) return res.status(404).json({ message: 'Evento no encontrado.' });
        if (eventDoc.data().organizerId !== uid) return res.status(403).json({ message: 'No autorizado.' });

        await eventRef.update({ status });
        res.status(200).json({ message: `Estado del evento actualizado a: ${status}` });
    } catch (error) {
        console.error(`Error en updateEventStatus para ${eventId}:`, error);
        res.status(500).json({ message: 'Error interno al actualizar el evento.' });
    }
};

/**
 * [NUEVO] Actualiza los detalles de un evento si se hace dentro de 1 hora de su creación.
 */
const updateEventDetails = async (req, res) => {
    const { uid } = req.user;
    const { eventId } = req.params;
    const updateData = req.body;

    const eventRef = db.collection('events').doc(eventId);
    try {
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) return res.status(404).json({ message: 'Evento no encontrado.' });
        
        const eventData = eventDoc.data();
        if (eventData.organizerId !== uid) return res.status(403).json({ message: 'No autorizado.' });

        // Regla de negocio: Solo se puede editar 1 hora después de la creación.
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
        res.status(200).json({ message: 'Detalles del evento actualizados.' });

    } catch (error) {
        console.error(`Error en updateEventDetails para ${eventId}:`, error);
        res.status(500).json({ message: 'Error interno al actualizar los detalles.' });
    }
};


module.exports = {
    getEventCategories,
    getEvents,
    getEventDetails,
    createEvent,
    updateEventStatus,
    updateEventDetails // Exportamos la nueva función
};