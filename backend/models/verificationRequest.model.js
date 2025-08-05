// backend/models/verificationRequest.model.js
// Define la estructura para un documento en la colección 'verificationRequests'.

/**
 * Devuelve el objeto base para una nueva solicitud de verificación.
 * @param {string} userId - El UID del usuario que realiza la solicitud.
 * @param {string} userName - El nombre del usuario (para fácil visualización en el admin panel).
 * @param {'vet' | 'shop' | 'foundation' | 'government'} verificationType - El tipo de perfil a verificar.
 * @param {Array<string>} documentUrls - Un array con las URLs seguras de los documentos subidos.
 * @returns {Object} El objeto de solicitud de verificación para Firestore.
 */
const getNewVerificationRequest = (userId, userName, verificationType, documentUrls) => ({
    userId,
    userName,
    verificationType,
    documents: documentUrls,
    status: 'pending', // Todas las solicitudes comienzan como pendientes.
    applicationDate: new Date().toISOString(),
    reviewedDate: null, // Se actualizará cuando un admin la revise.
    reviewedBy: null, // Se actualizará con el UID del admin.
    rejectionReason: ''
  });
  
  module.exports = {
    getNewVerificationRequest
  };