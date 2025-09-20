// backend/controllers/verification.controller.js
// Lógica de negocio para manejar las solicitudes de verificación de cuentas (Versión Mejorada).

const { db, bucket } = require('../config/firebase');
const { getNewVerificationRequest } = require('../models/verificationRequest.model');

/**
 * Procesa una nueva solicitud de verificación, creando un registro centralizado
 * y actualizando el estado del perfil del usuario.
 */
const requestVerification = async (req, res) => {
  const { uid, name } = req.user;
  const { verificationType } = req.body;

  if (!verificationType || !['vet', 'shop', 'foundation', 'government'].includes(verificationType)) {
    return res.status(400).json({ message: 'Se debe proporcionar un tipo de verificación válido.' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Se requieren documentos de soporte para la verificación.' });
  }

  const userRef = db.collection('users').doc(uid);
  const verificationRequestRef = db.collection('verificationRequests').doc();

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    const userData = userDoc.data();
    if (userData.verification?.status === 'pending' || userData.verification?.status === 'verified') {
        return res.status(409).json({ message: 'Ya existe una solicitud de verificación en proceso o aprobada.' });
    }

    // --- INICIO DEL CAMBIO ---
    // Función para obtener la URL optimizada que usaremos repetidamente
    const getOptimizedUrl = (filePath) => {
        const lastDotIndex = filePath.lastIndexOf('.');
        const pathWithoutExt = filePath.substring(0, lastDotIndex);
        const resizedFilePath = `${pathWithoutExt}_1080x1080.webp`;
        // Para verificación, generamos URL firmada, no pública. El script de migración lo entiende.
        // Pero al crearla, apuntamos al .webp que SE VA a crear
        return bucket.file(resizedFilePath).getSignedUrl({ action: 'read', expires: '01-01-2500' });
    };
    // --- FIN DEL CAMBIO ---

    const uploadPromises = req.files.map(file => {
      const filePath = `verification-documents/${uid}/${Date.now()}-${file.originalname}`;
      const fileUpload = bucket.file(filePath);
      const blobStream = fileUpload.createWriteStream({ metadata: { contentType: file.mimetype } });
      
      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => reject(`Error subiendo ${file.originalname}: ${err.message}`));
        blobStream.on('finish', async () => {
          try {
            // Generamos la URL optimizada en lugar de la original
            const signedUrl = await getOptimizedUrl(filePath);
            resolve(signedUrl[0]);
          } catch (urlError) { reject('Error al generar la URL optimizada del documento.'); }
        });
        blobStream.end(file.buffer);
      });
    });

    const documentUrls = await Promise.all(uploadPromises);
    const newRequest = getNewVerificationRequest(uid, name, verificationType, documentUrls);

    await db.runTransaction(async (transaction) => {
      transaction.set(verificationRequestRef, newRequest);
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