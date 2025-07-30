// frontend/src/MainHeader.jsx
// Versión 1.4 - Corrección de UI
// ELIMINADO: Se quita el botón "Editar Perfil" que no corresponde a este componente.

import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import { Plus } from 'lucide-react';
import styles from './MainHeader.module.css';

const PetBubble = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className={styles.petBubble} title={pet.name}>
    {pet.petPictureUrl ? <img src={pet.petPictureUrl} alt={pet.name} /> : <span>🐾</span>}
  </Link>
);

const AddPetBubble = () => (
    <Link to="/dashboard/pets" className={styles.petBubble} title="Añadir o gestionar mascotas" style={{backgroundColor: 'var(--border-color)', borderStyle: 'dashed'}}>
        <Plus size={32} color="var(--text-secondary)" />
    </Link>
);

function MainHeader({ userProfile, pets }) {
  if (!userProfile) {
    return null;
  }
  
  const currentUserId = auth.currentUser?.uid;

  return (
    <header className={styles.mainHeader}>
      <div className={styles.userProfileSection}>
        <Link to={`/dashboard/user/${currentUserId}`} className={styles.userProfileMainLink}>
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
      </div>
      <div className={styles.userPetsSection}>
        <h1 className={styles.headerBrandTitle}>enlapet</h1>
        <div className={styles.petBubblesContainer}>
          {pets && pets.length > 0 ? (
            pets.map(pet => <PetBubble key={pet.id} pet={pet} />)
          ) : (
            <p className={styles.noPetsHeader}>Añade tu primera mascota</p>
          )}
          <AddPetBubble />
        </div>
      </div>
    </header>
  );
}

export default MainHeader;