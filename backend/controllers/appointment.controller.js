// backend/controllers/appointment.controller.js
// Lógica de negocio para la gestión de citas entre usuarios y veterinarios.

const { db } = require('../config/firebase');
const { getNewAppointment } = require('../models/appointment.model');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

// ... (requestAppointment, getAvailableSlots, getMyAppointments, updateAppointmentStatus)
// La función requestAppointment es la única que necesita cambios.

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

        // --- INICIO DE LA CORRECCIÓN ---
        // Hacemos el código más robusto para manejar perfiles de mascotas sin el campo `linkedVets`
        const existingLinks = petDoc.data().linkedVets;
        const linkedVets = Array.isArray(existingLinks) ? existingLinks : [];
        // --- FIN DE LA CORRECCIÓN ---
        
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

const getMyAppointments = async (req, res) => {
    const { uid } = req.user;

    try {
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
            if (!appointments.some(app => app.id === doc.id)) {
                const data = doc.data();
                appointments.push({ id: doc.id, ...data });
                relatedUserIds.add(data.ownerId);
                relatedPetIds.add(data.petId);
            }
        });

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

        enrichedAppointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

        res.status(200).json(enrichedAppointments);

    } catch (error) {
        console.error('Error en getMyAppointments:', error);
        res.status(500).json({ message: 'Error al obtener las citas.' });
    }
};

const updateAppointmentStatus = async (req, res) => {
    const { uid } = req.user;
    const { appointmentId } = req.params;
    const { status, reason } = req.body;

    const validStatus = ['confirmed', 'cancelled_by_user', 'cancelled_by_vet', 'completed', 'no_show'];
    if (!status || !validStatus.includes(status)) {
        return res.status(400).json({ message: 'Se proporcionó un estado no válido.' });
    }

    const appointmentRef = db.collection('appointments').doc(appointmentId);

    try {
        await db.runTransaction(async (transaction) => {
            const appointmentDoc = await transaction.get(appointmentRef);
            if (!appointmentDoc.exists) {
                throw new Error('La cita no fue encontrada.');
            }

            const appointmentData = appointmentDoc.data();
            const isOwner = appointmentData.ownerId === uid;
            const isVet = appointmentData.vetId === uid;

            if (!isOwner && !isVet) {
                throw new Error('No estás autorizado para modificar esta cita.');
            }
            
            if (isOwner && status !== 'cancelled_by_user') {
                throw new Error('No tienes permiso para realizar esta acción.');
            }
            if (isVet && status === 'cancelled_by_user') {
                 throw new Error('Acción no válida para el veterinario.');
            }
            
            const updatePayload = { status, updatedAt: new Date().toISOString() };
            if (status === 'cancelled_by_vet' && reason) {
                updatePayload.cancellationReason = reason;
            }

            transaction.update(appointmentRef, updatePayload);
            
            const recipientId = isVet ? appointmentData.ownerId : appointmentData.vetId;
            await createNotification(recipientId, uid, 'appointment_status_update', appointmentId, 'appointment');
        });

        res.status(200).json({ message: 'El estado de la cita ha sido actualizado.' });

    } catch (error) {
        console.error('Error en updateAppointmentStatus:', error);
        res.status(400).json({ message: error.message || 'No se pudo actualizar la cita.' });
    }
};


module.exports = {
    requestAppointment,
    getAvailableSlots,
    getMyAppointments,
    updateAppointmentStatus,
};