// backend/controllers/appointment.controller.js
// (NUEVO) Lógica de negocio completa para el agendamiento, gestión y sesiones de citas.

const { db } = require('../config/firebase');
const { getNewAppointment } = require('../models/appointment.model');
const { createNotification } = require('../services/notification.service');

/**
 * Permite a un dueño de mascota solicitar una cita con un veterinario verificado.
 */
const createAppointmentRequest = async (req, res) => {
    const { uid: ownerId, name: ownerName } = req.user;
    const { vetId, petId, appointmentDate, reason } = req.body;

    if (!vetId || !petId || !appointmentDate || !reason) {
        return res.status(400).json({ message: 'Se requieren todos los campos para la solicitud de cita.' });
    }

    try {
        const vetRef = db.collection('users').doc(vetId);
        const petRef = db.collection('pets').doc(petId);

        const [vetDoc, petDoc] = await Promise.all([vetRef.get(), petRef.get()]);

        if (!vetDoc.exists || vetDoc.data().verification?.type !== 'vet') {
            return res.status(404).json({ message: 'Veterinario no encontrado o no verificado.' });
        }
        if (!petDoc.exists || petDoc.data().ownerId !== ownerId) {
            return res.status(403).json({ message: 'No estás autorizado para agendar citas para esta mascota.' });
        }

        const vetSettings = vetDoc.data().vetSettings;
        if (!vetSettings || !vetSettings.consultationDurationMinutes) {
            return res.status(400).json({ message: 'Este profesional no ha configurado su agenda.' });
        }
        
        const appointmentDetails = {
            vetId,
            ownerId,
            petId,
            petName: petDoc.data().name,
            ownerName,
            appointmentDate,
            durationMinutes: vetSettings.consultationDurationMinutes,
            reason
        };

        const newAppointment = getNewAppointment(appointmentDetails);
        const appointmentRef = await db.collection('appointments').add(newAppointment);

        await createNotification(vetId, ownerId, 'new_appointment_request', appointmentRef.id, 'appointment');

        res.status(201).json({ message: 'Tu solicitud de cita ha sido enviada al veterinario.', appointmentId: appointmentRef.id });

    } catch (error) {
        console.error('Error en createAppointmentRequest:', error);
        res.status(500).json({ message: 'Error interno al procesar la solicitud de cita.' });
    }
};

/**
 * Obtiene las citas para el usuario autenticado (dueño o veterinario).
 */
const getAppointments = async (req, res) => {
    const { uid } = req.user;
    const { view } = req.query; // Filtro: upcoming, past

    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ message: 'Usuario no encontrado.' });
        
        const isVet = userDoc.data().verification?.type === 'vet';
        const fieldToQuery = isVet ? 'vetId' : 'ownerId';
        const now = new Date().toISOString();

        let query = db.collection('appointments').where(fieldToQuery, '==', uid);

        if (view === 'past') {
            query = query.where('appointmentDate', '<', now);
        } else { // 'upcoming' or default
            query = query.where('appointmentDate', '>=', now);
        }

        const snapshot = await query.orderBy('appointmentDate', isVet ? 'asc' : 'desc').get();
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(appointments);

    } catch (error) {
        console.error('Error en getAppointments:', error);
        res.status(500).json({ message: 'Error al obtener las citas.' });
    }
};

/**
 * Permite a un veterinario actualizar el estado de una cita (confirmar o cancelar).
 */
const updateAppointmentStatus = async (req, res) => {
    const { uid: vetId } = req.user;
    const { appointmentId } = req.params;
    const { status } = req.body;

    const allowedStatus = ['confirmed', 'cancelled_by_vet'];
    if (!status || !allowedStatus.includes(status)) {
        return res.status(400).json({ message: 'Se requiere un estado válido (confirmed o cancelled_by_vet).' });
    }

    const appointmentRef = db.collection('appointments').doc(appointmentId);

    try {
        const appointmentDoc = await appointmentRef.get();
        if (!appointmentDoc.exists) return res.status(404).json({ message: 'Cita no encontrada.' });

        const appointmentData = appointmentDoc.data();
        if (appointmentData.vetId !== vetId) {
            return res.status(403).json({ message: 'No estás autorizado para modificar esta cita.' });
        }
        if (appointmentData.status !== 'pending') {
            return res.status(409).json({ message: 'Solo se pueden confirmar o cancelar citas pendientes.' });
        }

        await appointmentRef.update({ status });

        const notificationType = status === 'confirmed' ? 'appointment_confirmed' : 'appointment_cancelled';
        await createNotification(appointmentData.ownerId, vetId, notificationType, appointmentId, 'appointment');

        res.status(200).json({ message: `La cita ha sido marcada como '${status}'.` });

    } catch (error) {
        console.error('Error en updateAppointmentStatus:', error);
        res.status(500).json({ message: 'Error al actualizar el estado de la cita.' });
    }
};


/**
 * Permite a un veterinario iniciar una "Sesión Clínica Segura".
 */
const startClinicalSession = async (req, res) => {
    const { uid: vetId } = req.user;
    const { appointmentId } = req.params;
    const SESSION_DURATION_HOURS = 3;

    try {
        const appointmentRef = db.collection('appointments').doc(appointmentId);
        const appointmentDoc = await appointmentRef.get();

        if (!appointmentDoc.exists) return res.status(404).json({ message: 'Cita no encontrada.' });
        
        const appointmentData = appointmentDoc.data();
        if (appointmentData.vetId !== vetId) return res.status(403).json({ message: 'No autorizado.' });
        if (appointmentData.status !== 'confirmed') return res.status(400).json({ message: 'Solo se pueden iniciar sesiones para citas confirmadas.' });
        if (appointmentData.session?.isActive) return res.status(409).json({ message: 'La sesión clínica ya está activa.' });

        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

        const sessionData = {
            isActive: true,
            startedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        };

        await appointmentRef.update({ session: sessionData });
        
        await createNotification(appointmentData.ownerId, vetId, 'clinical_session_started', appointmentData.petId, 'pet');

        res.status(200).json({ message: 'Sesión clínica iniciada.', session: sessionData });
    } catch (error) {
        console.error('Error en startClinicalSession:', error);
        res.status(500).json({ message: 'No se pudo iniciar la sesión clínica.' });
    }
};


module.exports = {
    createAppointmentRequest,
    getAppointments,
    updateAppointmentStatus,
    startClinicalSession
};