// frontend/src/BottomNavBar.jsx
// Versión 1.5: Reemplaza Carrito por Búsquedas Activas y simplifica a solo íconos.

import React from 'react';
import { NavLink } from 'react-router-dom';
// 1. Se importan los íconos necesarios, incluyendo 'Search' para la nueva sección.
import { Home, Map, PlusSquare, Calendar, Search } from 'lucide-react';

import styles from './BottomNavBar.module.css';

// 2. Se actualizan las props: ya no se necesita 'onOpenCart'.
function BottomNavBar({ onOpenCreatePost }) {
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  return (
    <nav className={styles.navBar}>
      <NavLink to="/dashboard" end className={getNavLinkClass} title="Inicio">
        <Home className={styles.navIcon} size={28} />
      </NavLink>
      <NavLink to="/dashboard/map" className={getNavLinkClass} title="Mapa">
        <Map className={styles.navIcon} size={28} />
      </NavLink>
      
      <button onClick={onOpenCreatePost} className={styles.createPostButton} title="Crear Momento">
        <PlusSquare className={styles.navIcon} size={32} />
      </button>

      <NavLink to="/dashboard/events" className={getNavLinkClass} title="Eventos">
        <Calendar className={styles.navIcon} size={28} />
      </NavLink>

      {/* 3. Se reemplaza el NavLink anterior por el de la página de Búsquedas Activas */}
      <NavLink to="/dashboard/rescue" className={getNavLinkClass} title="Búsquedas Activas">
        <Search className={styles.navIcon} size={28} />
      </NavLink>
    </nav>
  );
}

export default BottomNavBar;