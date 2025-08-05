// backend/routes/verification.routes.js
// Define los endpoints PROTEGIDOS para la gestión de la verificación de cuentas.

const { Router } = require('express');
const multer = require('multer');
const { requestVerification } = require('../controllers/verification.controller');

// Configuración de Multer para la subida de múltiples archivos en memoria.
// Se limita a 5 archivos y 5MB por archivo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

// --- Rutas Protegidas (Requieren autenticación) ---

// URL: /api/verification/request
// Método: POST
// Función: Permite a un usuario enviar su solicitud de verificación con documentos.
// Se utiliza upload.array() para aceptar múltiples archivos bajo el campo 'documents'.
router.post('/verification/request', upload.array('documents', 5), requestVerification);

module.exports = router;