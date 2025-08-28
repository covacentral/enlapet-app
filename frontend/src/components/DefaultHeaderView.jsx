import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../MainHeader.module.css';
import { Search, Map, Calendar, Megaphone, Menu } from 'lucide-react';

const DefaultHeaderView = ({ user, pets, onNavigate }) => {
  const getTopNavLinkClass = ({ isActive }) =>
    isActive ? `${styles.topNavButton} ${styles.active}` : styles.topNavButton;

  return (
    <>
      {/* 1. Barra de navegación superior (original e intacta) */}
      <div className={styles.topNavBar}>
        <button className={styles.topNavButton} title="Buscar (Próximamente)">
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

      {/* 2. El nuevo carrusel de perfiles */}
      <div className={styles.profilesCarousel}>
        {/* Burbuja de usuario funcional */}
        <div className={styles.profileBubble} onClick={() => onNavigate(`/user/${user.uid}`)}>
          <img src={user.photoURL} alt="Tu Perfil" />
          <span>Tú</span>
        </div>

        {/* Burbujas de mascotas funcionales */}
        {pets.map(pet => (
          <div key={pet.id} className={styles.profileBubble} onClick={() => onNavigate(`/pet/${pet.id}`)}>
            <img src={pet.photoURL} alt={pet.name} />
            <span>{pet.name}</span>
          </div>
        ))}

        {/* Botón de añadir funcional */}
        <div className={styles.profileBubble} onClick={() => onNavigate('/add-pet')}>
          <div className={styles.addPetButton}>+</div>
          <span>Añadir</span>
        </div>
      </div>
    </>
  );
};

export default DefaultHeaderView;