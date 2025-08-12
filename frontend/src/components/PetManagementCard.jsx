// frontend/src/components/PetManagementCard.jsx
// Versión 1.1: Corrige el enlace del perfil de rescate y el estilo del botón.

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PetManagementCard.module.css';
import sharedStyles from '../shared.module.css';
import { AlertCircle } from 'lucide-react';

function PetManagementCard({ pet }) {
  const isProfileIncomplete = !pet.location?.city || !pet.healthRecord?.birthDate;

  return (
    <div className={styles.card}>
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
          {/* --- LÍNEA CORREGIDA --- */}
          {/* 1. El 'to' ahora apunta a la ruta pública correcta: /pet/:petId */}
          {/* 2. El className del botón se ajusta para que no tenga múltiples líneas. */}
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