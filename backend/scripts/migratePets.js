// backend/scripts/migratePets.js
// Script de migración v2 - CORREGIDO
// Asigna EPIDs únicos a mascotas que no lo tienen y corrige duplicados.

require('dotenv').config({ path: '../.env' });
const { db } = require('../config/firebase');
const { getNewPetProfile } = require('../models/pet.model');
// Importamos directamente el generador para tener control total
const { customAlphabet } = require('nanoid');
const generateEPID = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);


const migratePets = async () => {
  console.log('--- Iniciando v2: Corrección y migración de EPIDs ---');

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.error('ERROR: La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
    return;
  }

  try {
    const petsRef = db.collection('pets');
    const snapshot = await petsRef.get();

    if (snapshot.empty) {
      console.log('No se encontraron mascotas. No hay nada que migrar.');
      return;
    }

    let updatedCount = 0;
    const totalCount = snapshot.size;
    const batch = db.batch();
    const seenEpids = new Set(); // Para rastrear EPIDs en esta ejecución

    // Primero, poblamos el set con los EPIDs que ya son únicos y válidos
    snapshot.docs.forEach(doc => {
        const petData = doc.data();
        if (petData.epid) {
            seenEpids.add(petData.epid);
        }
    });
    
    console.log(`Se revisarán ${totalCount} perfiles. ${seenEpids.size} EPIDs válidos existentes.`);

    // Usamos un bucle for...of para poder usar await adentro si fuera necesario
    for (const doc of snapshot.docs) {
      const petData = doc.data();
      const petRef = doc.ref;
      let needsUpdate = false;
      const updatePayload = { ...petData }; // Empezamos con los datos existentes

      // Lógica de corrección: si el EPID no existe O si ya lo hemos visto (es un duplicado)
      if (!petData.epid || seenEpids.has(petData.epid)) {
        let newEpid;
        // Generamos un nuevo EPID hasta que encontremos uno que no exista
        do {
          newEpid = generateEPID();
        } while (seenEpids.has(newEpid));
        
        updatePayload.epid = newEpid;
        seenEpids.add(newEpid); // Lo añadimos al set para no repetirlo en esta misma ejecución
        needsUpdate = true;
        console.log(` -> Asignando NUEVO y ÚNICO EPID (${newEpid}) a: ${petData.name} (ID: doc.id)`);
      }

      // Añadimos campos faltantes si es necesario (sin sobreescribir el EPID nuevo)
      const petModel = getNewPetProfile('', ''); // Modelo de referencia
      Object.keys(petModel).forEach(field => {
        if (updatePayload[field] === undefined) {
          // No sobreescribimos el EPID que acabamos de generar
          if (field !== 'epid') {
            updatePayload[field] = petModel[field];
            needsUpdate = true;
            console.log(`    -> Añadiendo campo faltante '${field}' a: ${petData.name}`);
          }
        }
      });

      if (needsUpdate) {
        batch.update(petRef, updatePayload);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`\nSe corregirán y actualizarán ${updatedCount} mascotas. Ejecutando actualización...`);
      await batch.commit();
      console.log('¡Corrección completada con éxito!');
    } else {
      console.log('\nNo se encontraron duplicados ni mascotas sin EPID. La base de datos está consistente.');
    }

  } catch (error) {
    console.error('¡ERROR FATAL DURANTE LA CORRECCIÓN!', error);
  } finally {
    console.log('--- Proceso de corrección finalizado ---');
  }
};

migratePets();