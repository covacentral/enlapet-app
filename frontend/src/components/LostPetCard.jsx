// frontend/src/components/LostPetCard.jsx
// Versión 1.1: Corrige el enlace del perfil de rescate para usar el EPID.

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LostPetCard.module.css';
import sharedStyles from '../shared.module.css';
import { MapPin } from 'lucide-react';

function LostPetCard({ pet }) {
  // --- LÍNEA CORREGIDA ---
  // El enlace ahora apunta a la ruta pública correcta usando el EPID de la mascota.
  const rescueProfileLink = `/rescate/epid/${pet.epid}`; 

  return (
    <div className={styles.card}>
      <Link to={rescueProfileLink} className={styles.imageLink}>
        <img
          src={pet.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'}
          alt={pet.name}
          className={styles.petImage}
        />
      </Link>
      <div className={styles.petInfo}>
        <h4 className={styles.petName}>{pet.name}</h4>
        
        {pet.lastSeenAddress && (
          <div className={styles.lastSeen}>
            <MapPin size={14} />
            <span>Visto por últ. vez en {pet.lastSeenAddress}</span>
          </div>
        )}

        <div className={styles.cardFooter}>
          <Link
            to={rescueProfileLink}
            className={`${sharedStyles.button} ${sharedStyles.primary} ${styles.viewButton}`}
          >
            Ver Aviso
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LostPetCard;