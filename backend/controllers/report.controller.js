// backend/controllers/report.controller.js
// Lógica de negocio para la gestión de reportes de contenido.

const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Procesa un reporte de contenido enviado por un usuario.
 * Agrega o actualiza un documento de reporte para el contenido especificado.
 */
const createReport = async (req, res) => {
    const { uid } = req.user;
    const { contentId, contentType, reason } = req.body;

    if (!contentId || !reason || !contentType) {
        return res.status(400).json({ message: 'Se requiere ID, tipo de contenido y una razón para el reporte.' });
    }

    const reportRef = db.collection('reports').doc(contentId);

    try {
        let contentPreview = {};
        // Obtener una vista previa del contenido reportado
        if (contentType === 'post') {
            const doc = await db.collection('posts').doc(contentId).get();
            if (doc.exists) {
                contentPreview = {
                    authorId: doc.data().authorId,
                    preview: doc.data().caption.substring(0, 100)
                };
            }
        } else if (contentType === 'event') {
            const doc = await db.collection('events').doc(contentId).get();
            if (doc.exists) {
                contentPreview = {
                    authorId: doc.data().organizerId,
                    preview: doc.data().name
                };
            }
        }

        await db.runTransaction(async (transaction) => {
            const reportDoc = await transaction.get(reportRef);

            // Si es el primer reporte para este contenido, crear el documento
            if (!reportDoc.exists) {
                const newReport = {
                    contentType: contentType,
                    ...contentPreview,
                    totalReports: 1,
                    reasons: { [reason]: 1 },
                    reporters: [uid],
                    status: 'pending',
                    lastReportedAt: new Date().toISOString(),
                };
                transaction.set(reportRef, newReport);
            } else {
                // Si el usuario ya reportó, no hacer nada
                const reporterList = reportDoc.data().reporters || [];
                if (reporterList.includes(uid)) {
                    return; 
                }

                // Si es un nuevo reporte, actualizar el documento existente
                const updateData = {
                    totalReports: admin.firestore.FieldValue.increment(1),
                    [`reasons.${reason}`]: admin.firestore.FieldValue.increment(1),
                    reporters: admin.firestore.FieldValue.arrayUnion(uid),
                    lastReportedAt: new Date().toISOString(),
                };
                transaction.update(reportRef, updateData);
            }
        });

        res.status(200).json({ message: 'Tu reporte ha sido registrado. Gracias por tu ayuda.' });
    } catch (error) {
        console.error('Error al procesar el reporte:', error);
        res.status(500).json({ message: 'Error interno al procesar el reporte.' });
    }
};

module.exports = {
    createReport
};