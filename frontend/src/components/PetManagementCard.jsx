// frontend/src/components/PetManagementCard.jsx
// Versión 1.0: Componente de tarjeta para la vista de gestión de mascotas en el MainHeader.

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PetManagementCard.module.css';
import sharedStyles from '../shared.module.css';
import { AlertCircle } from 'lucide-react';

function PetManagementCard({ pet }) {
  // La lógica para determinar si el perfil está incompleto reside aquí.
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
          <Link 
            to={`/dashboard/pet/${pet.id}`} 
            className={`${sharedStyles.button} ${sharedStyles.primary}`}
          >
            Ver perfil de rescate
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PetManagementCard;