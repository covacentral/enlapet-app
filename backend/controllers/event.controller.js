// backend/controllers/event.controller.js

const { db, admin } = require('../config/firebase');

// --- Controlador para obtener todos los eventos ---
const getAllEvents = async (req, res) => {
  try {
    // Obtenemos todos los documentos de la colección 'events'
    // y los ordenamos por fecha del evento.
    const eventsSnapshot = await db.collection('events').orderBy('date', 'asc').get();

    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(events);
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
    res.status(500).json({ message: 'Error del servidor al obtener los eventos.' });
  }
};

// --- Controlador para crear un nuevo evento ---
const createEvent = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { title, description, date, location } = req.body;

    if (!title || !description || !date || !location) {
      return res.status(400).json({ message: 'Todos los campos son requeridos para crear el evento.' });
    }

    const newEvent = {
      creatorId: userId,
      title,
      description,
      date,
      location,
      attendees: [], // Lista inicial de asistentes vacía
      attendeesCount: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('events').add(newEvent);

    res.status(201).json({ message: 'Evento creado exitosamente.', id: docRef.id, ...newEvent });
  } catch (error) {
    console.error('Error al crear el evento:', error);
    res.status(500).json({ message: 'Error del servidor al crear el evento.' });
  }
};

// --- Controlador para que un usuario asista a un evento ---
const attendEvent = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { eventId } = req.params;

    const eventRef = db.collection('events').doc(eventId);

    // Usamos una transacción para asegurar la consistencia de los datos.
    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error('El evento no existe.');
      }

      const eventData = eventDoc.data();
      
      // Verificamos si el usuario ya está en la lista de asistentes.
      if (eventData.attendees && eventData.attendees.includes(userId)) {
        // Podríamos devolver un error o simplemente no hacer nada.
        // Por ahora, no hacemos nada para que la operación sea idempotente.
        return;
      }

      // Si no está, lo añadimos a la lista y actualizamos el contador.
      transaction.update(eventRef, {
        attendees: admin.firestore.FieldValue.arrayUnion(userId),
        attendeesCount: admin.firestore.FieldValue.increment(1)
      });
    });

    res.status(200).json({ message: 'Te has registrado al evento exitosamente.' });
  } catch (error) {
    console.error('Error al registrarse en el evento:', error);
    if (error.message === 'El evento no existe.') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error del servidor al registrarse en el evento.' });
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  attendEvent,
};
