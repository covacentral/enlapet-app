// backend/controllers/verification.controller.js
// Lógica de negocio para manejar las solicitudes de verificación de cuentas (Versión Mejorada).

const { db, bucket } = require('../config/firebase');
const { getNewVerificationRequest } = require('../models/verificationRequest.model');

/**
 * Procesa una nueva solicitud de verificación, creando un registro centralizado
 * y actualizando el estado del perfil del usuario.
 */
const requestVerification = async (req, res) => {
  const { uid, name } = req.user; // Obtenemos el nombre desde el token decodificado
  const { verificationType } = req.body;

  // 1. Validación de la entrada
  if (!verificationType || !['vet', 'shop', 'foundation', 'government'].includes(verificationType)) {
    return res.status(400).json({ message: 'Se debe proporcionar un tipo de verificación válido.' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Se requieren documentos de soporte para la verificación.' });
  }

  const userRef = db.collection('users').doc(uid);
  const verificationRequestRef = db.collection('verificationRequests').doc(); // Nuevo documento de solicitud

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    const userData = userDoc.data();
    if (userData.verification?.status === 'pending' || userData.verification?.status === 'verified') {
        return res.status(409).json({ message: 'Ya existe una solicitud de verificación en proceso o aprobada.' });
    }

    // 2. Subida de Documentos a Firebase Storage (sin cambios)
    const uploadPromises = req.files.map(file => {
      const filePath = `verification-documents/${uid}/${Date.now()}-${file.originalname}`;
      const fileUpload = bucket.file(filePath);
      const blobStream = fileUpload.createWriteStream({ metadata: { contentType: file.mimetype } });
      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => reject(`Error subiendo ${file.originalname}: ${err.message}`));
        blobStream.on('finish', async () => {
          try {
            // Generamos una URL firmada de larga duración para que el admin pueda accederla
            const signedUrl = await fileUpload.getSignedUrl({ action: 'read', expires: '01-01-2500' });
            resolve(signedUrl[0]);
          } catch (urlError) { reject('Error al generar la URL del documento.'); }
        });
        blobStream.end(file.buffer);
      });
    });
    const documentUrls = await Promise.all(uploadPromises);

    // 3. Creación del nuevo registro de solicitud usando el modelo
    const newRequest = getNewVerificationRequest(uid, name, verificationType, documentUrls);

    // 4. Doble escritura en una transacción para garantizar consistencia
    await db.runTransaction(async (transaction) => {
      // Escritura 1: Crear el nuevo documento en 'verificationRequests'
      transaction.set(verificationRequestRef, newRequest);

      // Escritura 2: Actualizar el perfil del usuario
      const verificationStatusUpdate = {
        type: verificationType,
        status: 'pending',
        lastApplicationDate: newRequest.applicationDate,
      };
      transaction.update(userRef, { verification: verificationStatusUpdate });
    });

    res.status(200).json({ message: 'Tu solicitud de verificación ha sido enviada con éxito.' });

  } catch (error) {
    console.error('Error en requestVerification:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  }
};

module.exports = {
  requestVerification
};