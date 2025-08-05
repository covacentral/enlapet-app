// frontend/src/MainHeader.jsx
// Versión 1.3 - Añade enlace condicional al Panel de Veterinario
// TAREA: Se muestra un botón de acceso al panel solo si el usuario es un veterinario verificado.

import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import { Plus, Stethoscope } from 'lucide-react'; // <-- 1. Importamos un nuevo ícono

import styles from './MainHeader.module.css';
import sharedStyles from './shared.module.css'; // <-- 2. Importamos estilos compartidos para el botón

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

function MainHeader({ userProfile, pets }) {
  if (!userProfile) {
    return null;
  }
  
  const currentUserId = auth.currentUser?.uid;

  // --- 3. Lógica para determinar si mostrar el botón del panel ---
  const isVerifiedVet = userProfile.verification?.status === 'verified' && userProfile.verification?.type === 'vet';

  return (
    <header className={styles.header}>
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
        
        {/* --- 4. Renderizado condicional del botón --- */}
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
    </header>
  );
}

export default MainHeader;