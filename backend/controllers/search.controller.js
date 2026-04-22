const { db } = require('../config/firebase');

const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const searchUsersAndVets = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.status(200).json([]);
        
        const term = q.trim();
        const textUpper = capitalize(term);
        const textLower = term.toLowerCase();

        // 1. Doble Consulta en paralelo por capitalización (Solución Anti-Algolia)
        const upperQuery = db.collection('users')
            .where('name', '>=', textUpper)
            .where('name', '<=', textUpper + '\uf8ff')
            .limit(10)
            .get();
            
        const lowerQuery = db.collection('users')
            .where('name', '>=', textLower)
            .where('name', '<=', textLower + '\uf8ff')
            .limit(10)
            .get();

        const [upperSnap, lowerSnap] = await Promise.all([upperQuery, lowerQuery]);
        
        const resultsMap = new Map();
        
        const extractData = (doc) => {
            if (!resultsMap.has(doc.id)) {
                const data = doc.data();
                resultsMap.set(doc.id, {
                    id: doc.id,
                    name: data.name,
                    profilePictureUrl: data.profilePictureUrl || '',
                    bio: data.bio || '',
                    verification: data.verification || { status: 'none', type: 'none' }
                });
            }
        };

        upperSnap.docs.forEach(extractData);
        lowerSnap.docs.forEach(extractData);

        // Limitamos para protección extrema de lecturas
        const finalResults = Array.from(resultsMap.values()).slice(0, 15);
        res.status(200).json(finalResults);

    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Error interno en búsqueda de usuarios.' });
    }
};

const searchPets = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.status(200).json([]);
        
        const term = q.trim();

        // 1. Buscamos primero si es exactamente un EPID (Mayúsculas fijas)
        const epidQuery = db.collection('pets')
            .where('epid', '==', term.toUpperCase())
            .limit(1)
            .get();

        // 2. Buscamos por prefijo de nombre de mascota
        const textUpper = capitalize(term);
        const nameQuery = db.collection('pets')
            .where('name', '>=', textUpper)
            .where('name', '<=', textUpper + '\uf8ff')
            .limit(10)
            .get();

        const [epidSnap, nameSnap] = await Promise.all([epidQuery, nameQuery]);

        const resultsMap = new Map();
        
        const extractData = (doc) => {
            if (!resultsMap.has(doc.id)) {
                const data = doc.data();
                resultsMap.set(doc.id, {
                    id: doc.id,
                    epid: data.epid,
                    name: data.name,
                    breed: data.breed,
                    petPictureUrl: data.petPictureUrl || '',
                    rescueMode: data.rescueMode || { isActive: false }
                });
            }
        };

        if (!epidSnap.empty) {
            extractData(epidSnap.docs[0]);
        }
        
        nameSnap.docs.forEach(extractData);

        const finalResults = Array.from(resultsMap.values()).slice(0, 15);
        res.status(200).json(finalResults);

    } catch (error) {
        console.error('Error searching pets:', error);
        res.status(500).json({ message: 'Error en la búsqueda de mascotas.' });
    }
};

module.exports = {
    searchUsersAndVets,
    searchPets
};
