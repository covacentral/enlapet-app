// frontend/src/components/PetManagementCard.jsx
// Versión 1.2: Integra la activación del Modo Rescate y un indicador visual.

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PetManagementCard.module.css';
import sharedStyles from '../shared.module.css';
import { AlertCircle, Announce } from 'lucide-react';

// --- [NUEVO] Subcomponente para el banner de mascota perdida ---
const RescueModeActiveBanner = () => (
    <div className={styles.rescueBanner}>
        <Announce size={14} />
        <span>EN BÚSQUEDA</span>
    </div>
);


function PetManagementCard({ pet, onRescueClick }) { // <-- 1. Añadimos onRescueClick como prop
  const isProfileIncomplete = !pet.location?.city || !pet.healthRecord?.birthDate;

  return (
    <div className={styles.card}>
      {/* --- 2. Mostramos el banner si el modo rescate está activo --- */}
      {pet.rescueMode?.isActive && <RescueModeActiveBanner />}
      
      <img
        src={pet.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'}
        alt={pet.name}
        className={styles.petImage}
      />
      <div className={styles.petInfo}>
        <h4 className={styles.petName}>{pet.name}</h4>
        <p className={styles.petBreed}>{pet.breed || 'Raza no especificada'}</p>

        {isProfileIncomplete && (
          <div className={styles.incompleteProfileWarning}>
            <AlertCircle size={14} />
            <span>¡Completa mi perfil!</span>
          </div>
        )}

        <div className={styles.cardFooter}>
          {/* --- 3. El botón ahora es condicional --- */}
          {pet.rescueMode?.isActive ? (
            <button
                // Este botón permitirá abrir el modal para *actualizar* o *desactivar* el modo rescate.
                onClick={() => onRescueClick(pet)}
                className={`${sharedStyles.button} ${sharedStyles.danger} ${styles.rescueButton}`}
            >
                Gestionar Búsqueda
            </button>
          ) : (
            <button
                // Este botón abrirá el modal para *activar* el modo rescate.
                onClick={() => onRescueClick(pet)}
                className={`${sharedStyles.button} ${sharedStyles.secondary} ${styles.rescueButton}`}
            >
                Reportar como extraviada
            </button>
          )}
          
          <Link
            to={`/pet/${pet.id}`}
            className={`${sharedStyles.button} ${sharedStyles.primary} ${styles.rescueButton}`}
          >
            Ver perfil de rescate
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PetManagementCard;