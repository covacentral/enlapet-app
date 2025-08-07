// frontend/src/BottomNavBar.jsx
// Versión 1.2 - Añadido el enlace a la página de Citas
// TAREA: Se añade un nuevo NavLink para que los usuarios accedan a su gestión de citas.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, PlusSquare, Calendar, Bell, CalendarClock } from 'lucide-react'; // 1. Importamos el nuevo ícono

import styles from './BottomNavBar.module.css';

function BottomNavBar({ unreadCount, onOpenCreatePost }) {
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  return (
    <nav className={styles.navBar}>
      <NavLink to="/dashboard" end className={getNavLinkClass}>
        <Home className={styles.navIcon} />
        <span className={styles.navLabel}>Inicio</span>
      </NavLink>
      <NavLink to="/dashboard/map" className={getNavLinkClass}>
        <Map className={styles.navIcon} />
        <span className={styles.navLabel}>Mapa</span>
      </NavLink>
      
      <button onClick={onOpenCreatePost} className={styles.createPostButton}>
        <PlusSquare className={styles.navIcon} size={28} />
      </button>

      {/* --- 2. AÑADIMOS EL NUEVO ENLACE A CITAS --- */}
      <NavLink to="/dashboard/appointments" className={getNavLinkClass}>
        <CalendarClock className={styles.navIcon} />
        <span className={styles.navLabel}>Citas</span>
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