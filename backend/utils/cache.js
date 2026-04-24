// backend/utils/cache.js
// VERSIÓN 1.0: Caché Global para Arquitectura Event-Driven

const NodeCache = require('node-cache');

// --- Caché Principal del Sistema ---
// Configurado con 24 horas (86400 segundos) de vida por defecto para datos globales.
// La estrategia es JAMÁS limpiar por tiempo (TTL infinito virtual), sino limpiar
// manual y quirúrgicamente por EVENTOS (Ej: cuando alguien publica o sigue a alguien).
const globalCache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

// Exportamos la única instancia global para que todos los controladores
// puedan leer y destruir las llaves (keys) cruzadas.
module.exports = globalCache;
