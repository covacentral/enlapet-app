import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../MainHeader.module.css';
import { Search, Map, Calendar, Megaphone, Menu } from 'lucide-react';

// URL para una imagen de respaldo genérica
const FALLBACK_IMAGE_URL = 'https://placehold.co/100x100/E2E8F0/4A5568?text=🐾';

const DefaultHeaderView = ({ user, pets, onNavigate }) => {
  const getTopNavLinkClass = ({ isActive }) =>
    isActive ? `${styles.topNavButton} ${styles.active}` : styles.topNavButton;

  return (
    <>
      {/* 1. Barra de navegación superior (sin cambios) */}
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

      {/* 2. El carrusel de perfiles (versión a prueba de errores) */}
      <div className={styles.profilesCarousel}>
        
        {/* Renderizado seguro de la burbuja del usuario */}
        {user && (
          <div className={styles.profileBubble} onClick={() => onNavigate(`/user/${user.uid}`)}>
            <img src={user.photoURL || FALLBACK_IMAGE_URL} alt="Tu Perfil" />
            <span>Tú</span>
          </div>
        )}

        {/* Renderizado seguro de las burbujas de mascotas */}
        {/* Se verifica que 'pets' sea un array antes de intentar mapearlo */}
        {Array.isArray(pets) && pets.map(pet => {
          // Se verifica que el objeto 'pet' y su 'id' existan antes de renderizar
          if (!pet || !pet.id) return null;
          
          return (
            <div key={pet.id} className={styles.profileBubble} onClick={() => onNavigate(`/pet/${pet.id}`)}>
              {/* Se usa la imagen de la mascota o la de respaldo si no existe */}
              <img src={pet.photoURL || FALLBACK_IMAGE_URL} alt={pet.name || 'Mascota'} />
              <span>{pet.name || 'Sin nombre'}</span>
            </div>
          );
        })}

        {/* Botón de añadir (siempre presente) */}
        <div className={styles.profileBubble} onClick={() => onNavigate('/add-pet')}>
          <div className={styles.addPetButton}>+</div>
          <span>Añadir</span>
        </div>
      </div>
    </>
  );
};

export default DefaultHeaderView;