// frontend/src/components/DefaultHeaderView.jsx
// Versión 1.2: Se integra la barra de navegación superior y se reestructura el layout.

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { auth } from '../firebase';
import { Plus, Stethoscope, Search, Map, Calendar, Megaphone, Menu } from 'lucide-react';

import styles from '../MainHeader.module.css';
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

  const handleSearchClick = () => {
    alert('Próximamente: Búsqueda de usuarios, mascotas y perfiles verificados.');
  };

  const getTopNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.topNavButton} ${styles.active}` : styles.topNavButton;
  };

  return (
    // Usamos un Fragment para que este componente no imponga un div extra. El layout lo manejan las clases de los elementos hijos.
    <>
      <div className={styles.userProfileSection}>
          {/* La barra de navegación ahora vive aquí y se posiciona con 'order: -1' desde el CSS */}
          <div className={styles.topNavBar}>
              <button onClick={handleSearchClick} className={styles.topNavButton} title="Buscar (Próximamente)">
                  <Search size={22} />
              </button>
              <NavLink to="/dashboard/map" className={getTopNavLinkClass} title="Mapa Comunitario">
                  <Map size={22} />
              </NavLink>
              <NavLink to="/dashboard/events" className={getTopNavLinkClass} title="Eventos">
                  <Calendar size={22} />
              </NavLink>
              <NavLink to="/dashboard/rescue" className={getTopNavLinkClass} title="Búsquedas Activas">
                  <Megaphone size={22} />
              </NavLink>
              <NavLink to="/dashboard/settings" className={getTopNavLinkClass} title="Ajustes y Menú">
                  <Menu size={22} />
              </NavLink>
          </div>

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
    </>
  );
}

export default DefaultHeaderView;