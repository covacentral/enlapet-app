// backend/scripts/migrateVetLinks.js
// Script de migración único para poblar el campo 'activeVetIds'. (Versión Corregida)
// TAREA: Se elimina la validación de la variable de entorno para permitir la ejecución en Google Cloud Shell.

require('dotenv').config({ path: '../.env' });
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const migrateVetLinks = async () => {
  console.log('--- Iniciando migración de Vínculos de Veterinarios a activeVetIds ---');

  // La validación de la variable de entorno ha sido eliminada.
  // El archivo config/firebase.js ahora maneja la autenticación de forma inteligente.

  try {
    const petsRef = db.collection('pets');
    const snapshot = await petsRef.get();

    if (snapshot.empty) {
      console.log('No se encontraron mascotas. No hay nada que migrar.');
      return;
    }

    let petsToUpdate = 0;
    const batch = db.batch();
    const totalPets = snapshot.size;
    console.log(`Revisando ${totalPets} perfiles de mascotas...`);

    snapshot.docs.forEach(doc => {
      const petData = doc.data();
      const petRef = doc.ref;
      let needsUpdate = false;
      
      const activeVetIds = petData.activeVetIds || [];

      if (Array.isArray(petData.linkedVets) && petData.linkedVets.length > 0) {
        petData.linkedVets.forEach(link => {
          if (link.status === 'active' && !activeVetIds.includes(link.vetId)) {
            activeVetIds.push(link.vetId);
            needsUpdate = true;
          }
        });
      }

      if (needsUpdate) {
        console.log(` -> Actualizando a ${petData.name} (ID: ${doc.id}) con los siguientes IDs de veterinarios: ${activeVetIds.join(', ')}`);
        batch.update(petRef, { activeVetIds: activeVetIds });
        petsToUpdate++;
      }
    });

    if (petsToUpdate > 0) {
      console.log(`\nSe actualizarán ${petsToUpdate} mascotas. Ejecutando escritura en la base de datos...`);
      await batch.commit();
      console.log('¡Migración completada con éxito!');
    } else {
      console.log('\nNo se encontraron mascotas que necesiten actualización. La base de datos ya está consistente.');
    }

  } catch (error) {
    console.error('¡ERROR FATAL DURANTE LA MIGRACIÓN!', error);
  } finally {
    console.log('--- Proceso de migración finalizado ---');
    // Cerramos la conexión para que el script finalice correctamente en Cloud Shell
    // Nota: Firebase Admin SDK maneja las conexiones automáticamente, no es necesario un cierre explícito.
  }
};

migrateVetLinks();