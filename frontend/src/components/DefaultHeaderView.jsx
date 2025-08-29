// frontend/src/components/DefaultHeaderView.jsx
// Versión Final: Muestra el nuevo diseño del carrusel y mantiene la barra de navegación original.

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { auth } from '../firebase';
import { Plus, Search, Map, Calendar, Megaphone, Menu } from 'lucide-react';

import styles from '../MainHeader.module.css';

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
  const currentUserId = auth.currentUser?.uid;

  const handleSearchClick = () => {
    alert('Próximamente: Búsqueda de usuarios, mascotas y perfiles verificados.');
  };

  const getTopNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.topNavButton} ${styles.active}` : styles.topNavButton;
  };

  return (
    <>
      {/* 1. BARRA DE NAVEGACIÓN SUPERIOR (ORIGINAL, FUNCIONAL E INTOCADA) */}
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

      {/* 2. NUEVO CARRUSEL DE PERFILES */}
      <div className={styles.petBubblesContainer}>
        {/* Burbuja del Usuario (Nuevo) */}
        {userProfile && (
            <Link to={`/dashboard/user/${currentUserId}`} className={styles.petBubble} title="Tu Perfil">
              <img src={userProfile.profilePictureUrl} alt="Tu Perfil" />
            </Link>
        )}
        
        {/* Burbujas de Mascotas (Lógica Original) */}
        {pets && pets.map(pet => <PetBubble key={pet.id} pet={pet} />)}
        
        {/* Botón de Añadir Mascota (Lógica Original) */}
        <AddPetBubble />
      </div>
    </>
  );
}

export default DefaultHeaderView;