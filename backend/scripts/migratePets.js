// backend/scripts/migratePets.js
// Script de migración único para actualizar los perfiles de mascotas antiguos.
// VERSIÓN CORREGIDA: No depende de 'dotenv' y confía en las variables de entorno del sistema.

// Importamos la configuración de Firebase y el modelo de mascota.
// El archivo de configuración ya se encarga de leer process.env.
const { db } = require('../config/firebase');
const { getNewPetProfile } = require('../models/pet.model');

/**
 * Función principal del script de migración.
 */
const migratePets = async () => {
  console.log('--- Iniciando migración de perfiles de mascotas ---');

  // Verificación de la variable de entorno esencial
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.error('ERROR: La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
    console.error('Asegúrate de que el script se está ejecutando en un entorno con las variables configuradas (como Render) o que la has exportado localmente para esta sesión.');
    return;
  }

  try {
    const petsRef = db.collection('pets');
    const snapshot = await petsRef.get();

    if (snapshot.empty) {
      console.log('No se encontraron mascotas en la base de datos. No hay nada que migrar.');
      return;
    }

    let updatedCount = 0;
    const totalCount = snapshot.size;
    const batch = db.batch();

    // Obtenemos un perfil de mascota "modelo" para saber qué campos deben existir.
    const petModel = getNewPetProfile('owner_placeholder', 'name_placeholder');
    const defaultFields = Object.keys(petModel);

    console.log(`Se revisarán ${totalCount} perfiles de mascotas.`);

    snapshot.docs.forEach(doc => {
      const petData = doc.data();
      let needsUpdate = false;
      const updatePayload = {};

      // 1. Verificación y asignación de EPID (la tarea principal)
      if (!petData.epid) {
        updatePayload.epid = getNewPetProfile('', '').epid;
        needsUpdate = true;
        console.log(` -> Asignando nuevo EPID a la mascota: ${petData.name} (ID: ${doc.id})`);
      }

      // 2. Verificación de otros campos estructurales faltantes
      defaultFields.forEach(field => {
        if (petData[field] === undefined) {
          updatePayload[field] = petModel[field];
          needsUpdate = true;
          console.log(`    -> Añadiendo campo faltante '${field}' a: ${petData.name}`);
        }
      });
      
      if (needsUpdate) {
        batch.update(doc.ref, updatePayload);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      console.log(`\nSe encontraron ${updatedCount} mascotas para actualizar. Ejecutando actualización masiva...`);
      await batch.commit();
      console.log('¡Actualización completada con éxito!');
    } else {
      console.log('\nTodos los perfiles de mascotas ya están actualizados. No se requiere ninguna acción.');
    }

  } catch (error) {
    console.error('¡ERROR FATAL DURANTE LA MIGRACIÓN!', error);
    console.error('La operación fue abortada. Es posible que algunos datos no se hayan actualizado.');
  } finally {
    console.log('--- Migración finalizada ---');
  }
};

// Ejecutamos la función.
migratePets();