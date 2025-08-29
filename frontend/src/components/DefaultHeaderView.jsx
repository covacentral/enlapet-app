// frontend/src/components/DefaultHeaderView.jsx
// Versión 2.1: Se elimina el botón de Panel Veterinario.

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { auth } from '../firebase';
import { Plus, Search, Map, Calendar, Megaphone, Menu } from 'lucide-react'; // Se elimina Stethoscope

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
  // ----- INICIO DE LA MODIFICACIÓN: Lógica eliminada -----
  // La constante isVerifiedVet ha sido eliminada de aquí.
  // ----- FIN DE LA MODIFICACIÓN -----

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
        
        {/* ----- INICIO DE LA MODIFICACIÓN: JSX eliminado ----- */}
        {/* El Link al vet-panel que estaba aquí ha sido completamente eliminado. */}
        {/* ----- FIN DE LA MODIFICACIÓN ----- */}
      </div>

      <div className={styles.userPetsSection}>
        {/* El h1 de enlapet ya fue eliminado en un paso anterior. */}
        <div className={styles.petBubblesContainer}>
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