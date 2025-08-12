// frontend/src/components/DefaultHeaderView.jsx
// Versión 1.0: Componente que encapsula la vista original del MainHeader.

import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { Plus, Stethoscope } from 'lucide-react';

import styles from '../MainHeader.module.css'; // Reutilizamos los estilos existentes
import sharedStyles from '../shared.module.css';

const PetBubble = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className={styles.petBubble} title={pet.name}>
    {pet.petPictureUrl ? <img src={pet.petPictureUrl} alt={pet.name} /> : <span>🐾</span>}
  </Link>
);

const AddPetBubble = () => (
    <Link to="/dashboard/pets" className={styles.addPetBubble} title="Añadir o gestionar mascotas">
        <Plus size={32} color="var(--text-secondary)" />
    </Link>
);

function DefaultHeaderView({ userProfile, pets }) {
  if (!userProfile) {
    return null;
  }
  
  const currentUserId = auth.currentUser?.uid;
  const isVerifiedVet = userProfile.verification?.status === 'verified' && userProfile.verification?.type === 'vet';

  return (
    <div className={styles.header}>
      <div className={styles.userProfileSection}>
        <Link to={`/dashboard/user/${currentUserId}`} className={styles.userProfileLink}>
            <h2 className={styles.userName}>{userProfile.name}</h2>
            <div className={styles.profilePictureContainer}>
              {userProfile.profilePictureUrl ? (
                <img src={userProfile.profilePictureUrl} alt="Perfil" className={styles.profilePicture} />
              ) : (
                <div className={styles.profilePicturePlaceholder}>👤</div>
              )}
            </div>
            <p className={styles.profileBio}>{userProfile.bio || 'Sin biografía.'}</p>
        </Link>
        
        {isVerifiedVet && (
            <Link to="/dashboard/vet-panel" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{marginTop: '15px', textDecoration: 'none'}}>
                <Stethoscope size={18} />
                Panel Veterinario
            </Link>
        )}
      </div>
      <div className={styles.userPetsSection}>
        <h1 className={styles.brandTitle}>enlapet</h1>
        <div className={styles.petBubblesContainer}>
          {pets && pets.length > 0 ? (
            pets.map(pet => <PetBubble key={pet.id} pet={pet} />)
          ) : (
            <p className={styles.noPetsHeader}>Añade tu primera mascota</p>
          )}
          <AddPetBubble />
        </div>
      </div>
    </div>
  );
}

export default DefaultHeaderView;