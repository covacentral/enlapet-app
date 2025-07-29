// backend/controllers/map.controller.js

const { db } = require('../config/firebase');

// --- Controlador para obtener todas las ubicaciones aprobadas ---
const getLocations = async (req, res) => {
  try {
    // Buscamos en la colección 'locations' todos los documentos
    // donde el estado sea 'approved' para mostrar solo los verificados.
    const locationsSnapshot = await db.collection('locations').where('status', '==', 'approved').get();

    const locations = locationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(locations);
  } catch (error) {
    console.error('Error al obtener las ubicaciones:', error);
    res.status(500).json({ message: 'Error del servidor al obtener las ubicaciones.' });
  }
};

// --- Controlador para que un usuario sugiera una nueva ubicación ---
const addLocation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, description, category, coordinates } = req.body;

    // Validación básica
    if (!name || !category || !coordinates) {
      return res.status(400).json({ message: 'Nombre, categoría y coordenadas son requeridos.' });
    }

    const newLocation = {
      submittedBy: userId,
      name,
      description: description || '',
      category, // ej: 'Parque', 'Veterinaria', 'Café Pet-Friendly'
      coordinates, // ej: { latitude: 40.7128, longitude: -74.0060 }
      status: 'pending', // Todas las nuevas ubicaciones requieren aprobación
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('locations').add(newLocation);

    res.status(201).json({ message: 'Ubicación sugerida exitosamente. Será revisada por un administrador.', id: docRef.id });
  } catch (error) {
    console.error('Error al añadir la ubicación:', error);
    res.status(500).json({ message: 'Error del servidor al añadir la ubicación.' });
  }
};

module.exports = {
  getLocations,
  addLocation,
};
