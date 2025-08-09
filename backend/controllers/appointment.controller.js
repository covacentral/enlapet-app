// backend/controllers/appointment.controller.js
// Lógica de negocio para la gestión de citas entre usuarios y veterinarios.

const { db } = require('../config/firebase');
const { getNewAppointment } = require('../models/appointment.model');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

/**
 * Permite a un dueño de mascota solicitar una nueva cita con un veterinario.
 */
const requestAppointment = async (req, res) => {
    const { uid: ownerId } = req.user;
    const { vetId, petId, appointmentDate, duration, reason } = req.body;

    try {
        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();
        if (!petDoc.exists || petDoc.data().ownerId !== ownerId) {
            return res.status(403).json({ message: 'No estás autorizado para agendar citas para esta mascota.' });
        }

        const newAppointmentData = getNewAppointment({
            vetId,
            ownerId,
            petId,
            appointmentDate,
            duration: parseInt(duration, 10),
            reason
        });
        
        const appointmentRef = await db.collection('appointments').add(newAppointmentData);

        const linkedVets = petDoc.data().linkedVets || [];
        const existingLinkIndex = linkedVets.findIndex(v => v.vetId === vetId);

        if (existingLinkIndex === -1) {
            linkedVets.push({ vetId, status: 'pending', linkedAt: new Date().toISOString() });
            await petRef.update({ linkedVets });
        } else if (linkedVets[existingLinkIndex].status !== 'active') {
            linkedVets[existingLinkIndex].status = 'pending';
            await petRef.update({ linkedVets });
        }

        await createNotification(vetId, ownerId, 'new_appointment_request', appointmentRef.id, 'appointment');

        res.status(201).json({ message: 'Solicitud de cita enviada con éxito.', appointmentId: appointmentRef.id });

    } catch (error) {
        console.error('Error en requestAppointment:', error);
        res.status(500).json({ message: error.message || 'Error interno al solicitar la cita.' });
    }
};


/**
 * Calcula los horarios disponibles para un veterinario en una fecha específica.
 */
const getAvailableSlots = async (req, res) => {
    const { vetId } = req.params;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Se requiere una fecha.' });
    }

    try {
        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

        const availabilityRef = db.collection('users').doc(vetId).collection('availability').doc(dayOfWeek);
        const availabilityDoc = await availabilityRef.get();

        if (!availabilityDoc.exists || !availabilityDoc.data().isActive) {
            return res.status(200).json([]);
        }
        const { startTime, endTime } = availabilityDoc.data();

        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        const appointmentsSnapshot = await db.collection('appointments')
            .where('vetId', '==', vetId)
            .where('appointmentDate', '>=', startOfDay.toISOString())
            .where('appointmentDate', '<=', endOfDay.toISOString())
            .get();

        const bookedSlots = new Set();
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            if (!appointment.status.startsWith('cancelled')) {
                const bookedDate = new Date(appointment.appointmentDate);
                const hours = bookedDate.getUTCHours().toString().padStart(2, '0');
                const minutes = bookedDate.getUTCMinutes().toString().padStart(2, '0');
                bookedSlots.add(`${hours}:${minutes}`);
            }
        });
        
        const availableSlots = [];
        const slotDuration = 30;
        let currentTime = new Date(`${date}T${startTime}:00.000Z`);
        const endTimeDate = new Date(`${date}T${endTime}:00.000Z`);

        while (currentTime < endTimeDate) {
            const hours = currentTime.getUTCHours().toString().padStart(2, '0');
            const minutes = currentTime.getUTCMinutes().toString().padStart(2, '0');
            const slotTime = `${hours}:${minutes}`;

            if (!bookedSlots.has(slotTime)) {
                availableSlots.push(slotTime);
            }
            currentTime.setUTCMinutes(currentTime.getUTCMinutes() + slotDuration);
        }

        res.status(200).json(availableSlots);

    } catch (error) {
        console.error('Error en getAvailableSlots:', error);
        res.status(500).json({ message: 'Error al calcular los horarios disponibles.' });
    }
};

/**
 * [NUEVO] Obtiene todas las citas de un usuario, ya sea como dueño o como veterinario.
 */
const getMyAppointments = async (req, res) => {
    const { uid } = req.user;

    try {
        // Realizamos dos consultas en paralelo
        const ownerQuery = db.collection('appointments').where('ownerId', '==', uid).get();
        const vetQuery = db.collection('appointments').where('vetId', '==', uid).get();
        const [ownerSnapshot, vetSnapshot] = await Promise.all([ownerQuery, vetQuery]);

        let appointments = [];
        const relatedUserIds = new Set();
        const relatedPetIds = new Set();

        ownerSnapshot.forEach(doc => {
            const data = doc.data();
            appointments.push({ id: doc.id, ...data });
            relatedUserIds.add(data.vetId);
            relatedPetIds.add(data.petId);
        });
        vetSnapshot.forEach(doc => {
            // Evitamos duplicados si un veterinario agenda una cita para su propia mascota
            if (!appointments.some(app => app.id === doc.id)) {
                const data = doc.data();
                appointments.push({ id: doc.id, ...data });
                relatedUserIds.add(data.ownerId);
                relatedPetIds.add(data.petId);
            }
        });

        // Enriquecer los datos con nombres de usuarios y mascotas
        const usersData = {};
        const petsData = {};

        if (relatedUserIds.size > 0) {
            const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', Array.from(relatedUserIds)).get();
            usersSnapshot.forEach(doc => { usersData[doc.id] = doc.data().name; });
        }
        if (relatedPetIds.size > 0) {
            const petsSnapshot = await db.collection('pets').where(admin.firestore.FieldPath.documentId(), 'in', Array.from(relatedPetIds)).get();
            petsSnapshot.forEach(doc => { petsData[doc.id] = doc.data().name; });
        }

        const enrichedAppointments = appointments.map(app => ({
            ...app,
            vetName: usersData[app.vetId] || 'No encontrado',
            ownerName: usersData[app.ownerId] || 'No encontrado',
            petName: petsData[app.petId] || 'No encontrada'
        }));

        // Ordenar por fecha de la cita, más próxima primero
        enrichedAppointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

        res.status(200).json(enrichedAppointments);

    } catch (error) {
        console.error('Error en getMyAppointments:', error);
        res.status(500).json({ message: 'Error al obtener las citas.' });
    }
};

module.exports = {
    requestAppointment,
    getAvailableSlots,
    getMyAppointments // Exportamos la nueva función
};