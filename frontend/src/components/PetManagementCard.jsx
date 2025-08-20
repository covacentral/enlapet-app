// frontend/src/components/PetManagementCard.jsx
// Versión 1.3: Corrige el error de build reemplazando el ícono inexistente.

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PetManagementCard.module.css';
import sharedStyles from '../shared.module.css';
// --- LÍNEA CORREGIDA ---
// Se reemplaza 'Announce' (que no existe) por 'Megaphone'.
import { AlertCircle, Megaphone } from 'lucide-react';

// --- Subcomponente para el banner de mascota perdida (con el ícono corregido) ---
const RescueModeActiveBanner = () => (
    <div className={styles.rescueBanner}>
        <Megaphone size={14} />
        <span>EN BÚSQUEDA</span>
    </div>
);


function PetManagementCard({ pet, onRescueClick }) {
  const isProfileIncomplete = !pet.location?.city || !pet.healthRecord?.birthDate;

  return (
    <div className={styles.card}>
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
          {pet.rescueMode?.isActive ? (
            <button
                onClick={() => onRescueClick(pet)}
                className={`${sharedStyles.button} ${sharedStyles.danger} ${styles.rescueButton}`}
            >
                Gestionar Búsqueda
            </button>
          ) : (
            <button
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