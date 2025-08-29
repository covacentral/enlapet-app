// frontend/src/components/DefaultHeaderView.jsx
// Versión modificada para cambiar el perfil de usuario a una burbuja.

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
    <>
      <div className={styles.userProfileSection}>
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

        {/* ----- CAMBIO 1: ELIMINACIÓN DEL PERFIL GRANDE ----- */}
        {/* El bloque <Link> que contenía el h2, img y p del perfil ha sido eliminado de aquí. */}
        
        {isVerifiedVet && (
            <Link to="/dashboard/vet-panel" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{marginTop: '15px', textDecoration: 'none'}}>
                <Stethoscope size={18} />
                Panel Veterinario
            </Link>
        )}
      </div>

      <div className={styles.userPetsSection}>
        <div className={styles.petBubblesContainer}>

          {/* ----- CAMBIO 2: ADICIÓN DE LA BURBUJA DE USUARIO ----- */}
          <Link to={`/dashboard/user/${currentUserId}`} className={`${styles.petBubble} ${styles.userBubble}`} title={userProfile.name}>
            {userProfile.profilePictureUrl ? (
              <img src={userProfile.profilePictureUrl} alt="Tu Perfil" />
            ) : (
              <div className={styles.profilePicturePlaceholder} style={{fontSize: '24px'}}>👤</div>
            )}
          </Link>

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