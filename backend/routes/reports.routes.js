// backend/routes/reports.routes.js
// Define el endpoint para la creación de reportes de contenido.

const { Router } = require('express');
const { createReport } = require('../controllers/report.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación.

// URL: /api/reports
// Método: POST
// Función: Crea un nuevo reporte para un contenido (post o evento).
router.post('/reports', createReport);

module.exports = router;