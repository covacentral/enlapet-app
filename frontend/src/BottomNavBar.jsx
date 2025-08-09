// frontend/src/BottomNavBar.jsx
// Versión 1.2 - Añadido enlace a la nueva página de Citas.
// TAREA: Se integra el acceso a la nueva funcionalidad de agendamiento.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, PlusSquare, Calendar, Bell, ClipboardList } from 'lucide-react'; // 1. Importamos ClipboardList

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
      
      {/* --- 2. [NUEVO] Enlace a la página de citas --- */}
      <NavLink to="/dashboard/appointments" className={getNavLinkClass}>
        <ClipboardList className={styles.navIcon} />
        <span className={styles.navLabel}>Citas</span>
      </NavLink>
      
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