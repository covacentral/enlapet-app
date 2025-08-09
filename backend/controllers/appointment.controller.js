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
        // Validación de propiedad de la mascota
        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();
        if (!petDoc.exists || petDoc.data().ownerId !== ownerId) {
            return res.status(403).json({ message: 'No estás autorizado para agendar citas para esta mascota.' });
        }

        // Crear el objeto de la nueva cita usando el modelo
        const newAppointmentData = getNewAppointment({
            vetId,
            ownerId,
            petId,
            appointmentDate,
            duration: parseInt(duration, 10),
            reason
        });
        
        // Guardar la nueva cita en la base de datos
        const appointmentRef = await db.collection('appointments').add(newAppointmentData);

        // Opcional: Crear o actualizar el vínculo de paciente a 'pending' si no es 'active'
        const linkedVets = petDoc.data().linkedVets || [];
        const existingLinkIndex = linkedVets.findIndex(v => v.vetId === vetId);

        if (existingLinkIndex === -1) {
            linkedVets.push({ vetId, status: 'pending', linkedAt: new Date().toISOString() });
            await petRef.update({ linkedVets });
        } else if (linkedVets[existingLinkIndex].status !== 'active') {
            linkedVets[existingLinkIndex].status = 'pending';
            await petRef.update({ linkedVets });
        }

        // Notificar al veterinario sobre la nueva solicitud de cita
        // (Asumimos que la notificación se le envía directamente al veterinario)
        await createNotification(vetId, ownerId, 'new_appointment_request', appointmentRef.id, 'appointment');

        res.status(201).json({ message: 'Solicitud de cita enviada con éxito.', appointmentId: appointmentRef.id });

    } catch (error) {
        console.error('Error en requestAppointment:', error);
        res.status(500).json({ message: error.message || 'Error interno al solicitar la cita.' });
    }
};


module.exports = {
    requestAppointment
    // Aquí añadiremos más funciones como getAppointments, updateAppointmentStatus, etc.
};