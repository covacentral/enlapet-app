// frontend/src/BottomNavBar.jsx
// Versión 1.1 - Refactorización a CSS Modules
// CAMBIO: Se importa y utiliza un módulo de CSS local.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, PlusSquare, Calendar, Bell } from 'lucide-react';
import styles from './BottomNavBar.module.css'; // <-- 1. Importamos el módulo de estilos

function BottomNavBar({ unreadCount, onOpenCreatePost }) {
  
  // Función para determinar las clases del NavLink
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  return (
    <nav className={styles.bottomNavBar}>
      <NavLink to="/dashboard" end className={getNavLinkClass}>
        <Home className={styles.navIcon} />
        <span className={styles.navLabel}>Inicio</span>
      </NavLink>
      <NavLink to="/dashboard/map" className={getNavLinkClass}>
        <Map className={styles.navIcon} />
        <span className={styles.navLabel}>Mapa</span>
      </NavLink>
      
      <button onClick={onOpenCreatePost} className={`${styles.navItem} ${styles.createPostButton}`}>
        <PlusSquare className={styles.navIcon} size={28} />
      </button>

      <NavLink to="/dashboard/events" className={getNavLinkClass}>
        <Calendar className={styles.navIcon} />
        <span className={styles.navLabel}>Eventos</span>
      </NavLink>
      <NavLink to="/dashboard/notifications" className={getNavLinkClass}>
        {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
        <Bell className={styles.navIcon} />
        <span className={styles.navLabel}>Alertas</span>
      </NavLink>
    </nav>
  );
}

export default BottomNavBar;