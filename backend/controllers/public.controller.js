// backend/controllers/public.controller.js
// VERSIÓN 2.0: Añade paginación a la función getActiveRescuePets.

const { db } = require('../config/firebase');

// --- (getPetPublicProfile y getUserPublicProfile no cambian) ---
const getPetPublicProfile = async (req, res) => {
    try {
        const { petId } = req.params;
        const petDoc = await db.collection('pets').doc(petId).get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Mascota no encontrada.' });
        }

        const petData = petDoc.data();
        const userDoc = await db.collection('users').doc(petData.ownerId).get();

        let ownerData = {
            id: petData.ownerId,
            name: 'Responsable',
            phone: 'No disponible'
        };

        if (userDoc.exists) {
            const fullOwnerData = userDoc.data();
            ownerData = {
                id: petData.ownerId,
                name: fullOwnerData.name,
                phone: fullOwnerData.phone || 'No proporcionado'
            };
        }
        
        if (petData.rescueMode?.isActive && !petData.rescueMode?.showContactPhone) {
            ownerData.phone = 'Contacto no autorizado por el dueño.';
        }


        const publicProfile = {
            pet: { ...petData, id: petDoc.id },
            owner: ownerData
        };
        res.status(200).json(publicProfile);
    } catch (error) {
        console.error(`Error en getPetPublicProfile para petId ${req.params.petId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
const getUserPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const userData = userDoc.data();
        
        const publicProfile = {
            id: userDoc.id,
            name: userData.name,
            profilePictureUrl: userData.profilePictureUrl || '',
            bio: userData.bio || '',
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
            verification: userData.verification || { status: 'none', type: 'none' },
        };

        const petsSnapshot = await db.collection('pets').where('ownerId', '==', userId).get();
        const petsList = petsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            breed: doc.data().breed,
            petPictureUrl: doc.data().petPictureUrl || ''
        }));

        res.status(200).json({ userProfile: publicProfile, pets: petsList });
    } catch (error) {
        console.error(`Error en getUserPublicProfile para userId ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
const getRescuePetProfileByEpid = async (req, res) => {
    try {
        const { epid } = req.params;
        const petsRef = db.collection('pets');
        const snapshot = await petsRef.where('epid', '==', epid.toUpperCase()).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No se encontró ninguna mascota con ese EPID.' });
        }
        
        const petDoc = snapshot.docs[0];
        const petData = petDoc.data();

        if (!petData.rescueMode?.isActive) {
            return res.status(403).json({ message: 'Esta mascota no ha sido reportada como extraviada.' });
        }

        const userDoc = await db.collection('users').doc(petData.ownerId).get();
        let ownerData = { name: 'Responsable', phone: null };

        if (userDoc.exists) {
            ownerData.name = userDoc.data().name;
            if (petData.rescueMode.showContactPhone) {
                ownerData.phone = userDoc.data().phone || null;
            }
        }
        
        const rescueProfile = {
            name: petData.name,
            breed: petData.breed,
            petPictureUrl: petData.petPictureUrl,
            lastSeen: petData.rescueMode.lastSeen || { coordinates: null, address: '', radius: 1000 },
            message: petData.rescueMode.message,
            ownerName: ownerData.name,
            contactPhone: ownerData.phone
        };
        
        res.status(200).json(rescueProfile);
    } catch (error) {
        console.error(`Error en getRescuePetProfileByEpid para EPID ${req.params.epid}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// --- [FUNCIÓN MODIFICADA] ---
const getActiveRescuePets = async (req, res) => {
    const { cursor } = req.query;
    const PAGE_SIZE = 10;

    try {
        let query = db.collection('pets')
            .where('rescueMode.isActive', '==', true)
            .orderBy('rescueMode.activatedAt', 'desc')
            .limit(PAGE_SIZE);

        if (cursor) {
            // Si hay un cursor, iniciamos la búsqueda a partir de ese valor.
            query = query.startAfter(cursor);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json({ pets: [], nextCursor: null });
        }

        const rescuePets = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                epid: data.epid,
                name: data.name,
                breed: data.breed,
                petPictureUrl: data.petPictureUrl,
                lastSeenAddress: data.rescueMode.lastSeen.address,
                activatedAt: data.rescueMode.activatedAt
            };
        });
        
        // Determinamos el cursor para la siguiente página.
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor = lastDoc ? lastDoc.data().rescueMode.activatedAt : null;

        res.status(200).json({
            pets: rescuePets,
            nextCursor: nextCursor
        });

    } catch (error) {
        console.error('Error en getActiveRescuePets:', error);
        res.status(500).json({ message: 'Error interno al obtener las mascotas en búsqueda.' });
    }
};


module.exports = {
    getPetPublicProfile,
    getUserPublicProfile,
    getRescuePetProfileByEpid,
    getActiveRescuePets
};