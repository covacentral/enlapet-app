// backend/controllers/verification.controller.js
// Lógica de negocio para manejar las solicitudes de verificación de cuentas.

const { db, bucket } = require('../config/firebase');

/**
 * Procesa una nueva solicitud de verificación de cuenta para el usuario autenticado.
 */
const requestVerification = async (req, res) => {
  const { uid } = req.user;
  const { verificationType } = req.body;

  // 1. Validación de la entrada
  if (!verificationType || !['vet', 'shop', 'foundation', 'government'].includes(verificationType)) {
    return res.status(400).json({ message: 'Se debe proporcionar un tipo de verificación válido.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Se requieren documentos de soporte para la verificación.' });
  }

  const userRef = db.collection('users').doc(uid);

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const userData = userDoc.data();
    // Prevenir solicitudes duplicadas si ya hay una pendiente o verificada
    if (userData.verification?.status === 'pending' || userData.verification?.status === 'verified') {
        return res.status(409).json({ message: 'Ya existe una solicitud de verificación en proceso o aprobada.' });
    }

    // 2. Subida de Documentos a Firebase Storage
    const uploadPromises = req.files.map(file => {
      const filePath = `verification-documents/${uid}/${Date.now()}-${file.originalname}`;
      const fileUpload = bucket.file(filePath);
      const blobStream = fileUpload.createWriteStream({
        metadata: { contentType: file.mimetype },
        resumable: false // Para archivos pequeños, no es necesario reanudar
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
          console.error('Error en blobStream (verification):', error);
          reject('Error durante la subida de un archivo.');
        });
        blobStream.on('finish', async () => {
          try {
            // No hacemos los documentos públicos, mantenemos la privacidad
            const signedUrl = await fileUpload.getSignedUrl({
              action: 'read',
              expires: '01-01-2500' // URL de larga duración para acceso del admin
            });
            resolve(signedUrl[0]);
          } catch (urlError) {
            reject('Error al generar la URL del documento.');
          }
        });
        blobStream.end(file.buffer);
      });
    });

    const documentUrls = await Promise.all(uploadPromises);

    // 3. Actualización del Documento de Usuario en Firestore
    const verificationData = {
      type: verificationType,
      status: 'pending',
      applicationDate: new Date().toISOString(),
      documents: documentUrls,
      rejectionReason: '' // Limpiar por si fue rechazado antes
    };

    await userRef.update({ verification: verificationData });

    res.status(200).json({ message: 'Tu solicitud de verificación ha sido enviada. La revisaremos pronto.' });

  } catch (error) {
    console.error('Error en requestVerification:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  }
};

module.exports = {
  requestVerification
};