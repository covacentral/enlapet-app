// backend/middleware/cache.js
// Middleware para interceptar llamadas GET y devolver respuestas en memoria.

const NodeCache = require('node-cache');

// Configuración estándar de la caché (5 Minutos de retención por defecto)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

/**
 * Middleware para rutas de lectura intensiva.
 */
const getCache = (req, res, next) => {
    // Solo permitimos caché en peticiones GET
    if (req.method !== 'GET') {
        return next();
    }

    // La URL original nos sirve como llave única de memoria
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        // Enviar resultado cacheado directo desde la RAM (0 delay, 0 coste BD)
        return res.json(cachedResponse);
    }

    // Si no está en caché, interceptamos el res.json para guardarlo antes de enviarlo
    const originalJson = res.json;
    res.json = (body) => {
        // Solo cacheamos respuestas exitosas
        if (res.statusCode >= 200 && res.statusCode < 300) {
            cache.set(key, body);
        }
        originalJson.call(res, body);
    };

    next();
};

/**
 * Función para limpiar la caché de forma programática.
 * Utilizado (Cache-Bursting) cuando un elemento nuevo es creado desde un POST/PUT.
 * @param {string} prefix - Prefijo de las rutas a limpiar, ej: "/api/posts"
 */
const clearCache = (prefix = '') => {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.includes(prefix));
    
    if (keysToDelete.length > 0) {
        cache.del(keysToDelete);
    }
};

module.exports = { getCache, clearCache };
