// frontend/src/components/DefaultHeaderView.jsx
// Versión 2.2: Alinea los nombres de clase con el nuevo CSS del diseño vibrante.

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { auth } from '../firebase';
import { Plus, Search, Map, Calendar, Megaphone, Menu } from 'lucide-react';

import styles from '../MainHeader.module.css';
// Se elimina la importación de sharedStyles ya que no se usa en este componente.

const PetBubble = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className={styles.petBubble} title={pet.name}>
    {pet.petPictureUrl ? <img src={pet.petPictureUrl} alt={pet.name} /> : <span>🐾</span>}
  </Link>
);

const AddPetBubble = () => (
    <Link to="/dashboard/pets" className={styles.addPetBubble} title="Añadir o gestionar mascotas">
        {/* El color del ícono Plus ahora será controlado por el CSS padre */}
        <Plus size={32} />
    </Link>
);

function DefaultHeaderView({ userProfile, pets }) {
  if (!userProfile) {
    return null;
  }
  
  const currentUserId = auth.currentUser?.uid;

  const handleSearchClick = () => {
    alert('Próximamente: Búsqueda de usuarios, mascotas y perfiles verificados.');
  };

  const getTopNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.topNavButton} ${styles.active}` : styles.topNavButton;
  };

  return (
    // Se utiliza un Fragment ya que el layout principal lo define el header y las clases internas.
    <>
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

      <div className={styles.petBubblesContainer}>
          <Link to={`/dashboard/user/${currentUserId}`} className={`${styles.petBubble} ${styles.userBubble}`} title={userProfile.name}>
            {userProfile.profilePictureUrl ? (
              <img src={userProfile.profilePictureUrl} alt="Tu Perfil" />
            ) : (
              // Se elimina el estilo inline, el CSS padre debe manejarlo.
              <div className={styles.profilePicturePlaceholder}>👤</div>
            )}
          </Link>

          {pets && pets.length > 0 ? (
            pets.map(pet => <PetBubble key={pet.id} pet={pet} />)
          ) : (
            <p className={styles.noPetsHeader}>Añade tu primera mascota</p>
          )}
          <AddPetBubble />
      </div>
    </>
  );
}

export default DefaultHeaderView;