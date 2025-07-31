// frontend/src/BottomNavBar.jsx
// Versión 1.1 - Refactorización a CSS Modules
// TAREA: Se implementa el módulo de estilos y se actualiza el manejo de la clase "active" de NavLink.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, PlusSquare, Calendar, Bell } from 'lucide-react';

// 1. IMPORTAMOS el nuevo módulo de estilos
import styles from './BottomNavBar.module.css';

function BottomNavBar({ unreadCount, onOpenCreatePost }) {
  // 2. Definimos una función para manejar las clases dinámicas de NavLink
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
      
      {/* El botón central ahora usa su propia clase del módulo */}
      <button onClick={onOpenCreatePost} className={styles.createPostButton}>
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