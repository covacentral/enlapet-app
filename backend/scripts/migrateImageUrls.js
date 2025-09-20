// /backend/scripts/migrateImageUrls.js

const { db } = require('../config/firebase');

/**
 * Convierte una URL de imagen original a la nueva URL optimizada (.webp).
 * Maneja correctamente URLs públicas y firmadas (con parámetros de query).
 */
function getResizedUrl(originalUrl) {
    if (!originalUrl || typeof originalUrl !== 'string' || !originalUrl.includes('storage.googleapis.com')) {
        return originalUrl;
    }
    
    const decodedUrl = decodeURIComponent(originalUrl);
    const path = decodedUrl.split('?')[0];
    const queryParams = decodedUrl.includes('?') ? '?' + decodedUrl.split('?').slice(1).join('?') : '';

    const lastDotIndex = path.lastIndexOf('.');
    const lastSlashIndex = path.lastIndexOf('/');
    
    if (lastDotIndex === -1 || lastDotIndex < lastSlashIndex) {
        return originalUrl;
    }
    
    const pathWithoutExt = path.substring(0, lastDotIndex);
    const resizedSuffix = '_1080x1080.webp';
    const newPath = encodeURI(`${pathWithoutExt}${resizedSuffix}`);

    return `${newPath}${queryParams}`;
}

/**
 * Actualiza documentos en una colección que tienen un campo de URL de imagen único.
 */
async function updateCollection(collectionName, urlFieldName) {
    console.log(`--- Iniciando migración para: ${collectionName} (campo: ${urlFieldName}) ---`);
    
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.where(urlFieldName, '!=', null).get();

    if (snapshot.empty) {
        console.log(`No se encontraron documentos con el campo '${urlFieldName}'.`);
        return;
    }

    let batch = db.batch();
    let updatesCount = 0;

    for (const doc of snapshot.docs) {
        const originalUrl = doc.data()[urlFieldName];

        if (originalUrl && typeof originalUrl === 'string' && !originalUrl.includes('.webp')) {
            const newUrl = getResizedUrl(originalUrl);
            if (newUrl !== originalUrl) {
                batch.update(doc.ref, { [urlFieldName]: newUrl });
                updatesCount++;
                console.log(`  [OK] Programado para actualizar doc ${doc.id}`);

                if (updatesCount > 0 && updatesCount % 490 === 0) {
                    await batch.commit();
                    batch = db.batch();
                }
            }
        }
    }

    if (updatesCount % 490 !== 0 && updatesCount > 0) {
        await batch.commit();
    }
    
    console.log(`--- Migración completada para ${collectionName}. Documentos actualizados: ${updatesCount} ---\n`);
}

/**
 * [NUEVO] Actualiza documentos que tienen un campo con un ARRAY de URLs.
 */
async function updateCollectionWithUrlArray(collectionName, arrayFieldName) {
    console.log(`--- Iniciando migración para: ${collectionName} (campo array: ${arrayFieldName}) ---`);
    
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.where(arrayFieldName, '!=', null).get();

    if (snapshot.empty) {
        console.log(`No se encontraron documentos con el campo '${arrayFieldName}'.`);
        return;
    }

    let batch = db.batch();
    let updatesCount = 0;

    for (const doc of snapshot.docs) {
        const originalUrls = doc.data()[arrayFieldName];

        if (Array.isArray(originalUrls) && originalUrls.length > 0) {
            let hasChanged = false;
            const newUrls = originalUrls.map(url => {
                if (url && typeof url === 'string' && !url.includes('.webp')) {
                    const newUrl = getResizedUrl(url);
                    if (newUrl !== url) {
                        hasChanged = true;
                    }
                    return newUrl;
                }
                return url;
            });

            if (hasChanged) {
                batch.update(doc.ref, { [arrayFieldName]: newUrls });
                updatesCount++;
                console.log(`  [OK] Programado para actualizar array en doc ${doc.id}`);

                if (updatesCount > 0 && updatesCount % 490 === 0) {
                    await batch.commit();
                    batch = db.batch();
                }
            }
        }
    }

    if (updatesCount > 0 && updatesCount % 490 !== 0) {
        await batch.commit();
    }
    
    console.log(`--- Migración completada para ${collectionName}. Documentos actualizados: ${updatesCount} ---\n`);
}

// --- FUNCIÓN PRINCIPAL QUE EJECUTA TODO ---
async function runMigration() {
    console.log('*** INICIANDO SCRIPT DE MIGRACIÓN DE URLS DE IMÁGENES ***\n');
    try {
        await updateCollection('users', 'profilePictureUrl');
        await updateCollection('pets', 'petPictureUrl');
        await updateCollection('posts', 'imageUrl');
        await updateCollection('events', 'coverImage'); // <-- AÑADIDO
        await updateCollectionWithUrlArray('verificationRequests', 'documentUrls'); // <-- AÑADIDO
        
        console.log('*** MIGRACIÓN FINALIZADA. Tu base de datos está sincronizada. ***');
    } catch(error) {
        console.error("\n!!!! ERROR DURANTE LA MIGRACIÓN !!!!");
        console.error(error);
        process.exit(1);
    }
}

runMigration();
