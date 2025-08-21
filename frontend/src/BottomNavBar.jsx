// frontend/src/BottomNavBar.jsx
// Versión 1.7: Actualiza el ícono de Mensajes por uno más moderno (MessagesSquare).

import React from 'react';
import { NavLink } from 'react-router-dom';
// 1. Se importa 'MessagesSquare' en lugar de 'Mail'.
import { Home, ShoppingBag, PlusSquare, MessagesSquare, Bell } from 'lucide-react';

import styles from './BottomNavBar.module.css';

function BottomNavBar({ onOpenCreatePost, notificationCount }) {
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  const handleMessagesClick = () => {
    alert('Próximamente: Mensajes directos entre usuarios.');
  };

  return (
    <nav className={styles.navBar}>
      <NavLink to="/dashboard" end className={getNavLinkClass} title="Inicio">
        <Home className={styles.navIcon} size={28} />
      </NavLink>

      <NavLink to="/dashboard/store/product/ENLAPET_COLLAR_V1" className={getNavLinkClass} title="Tienda">
        <ShoppingBag className={styles.navIcon} size={28} />
      </NavLink>
      
      <button onClick={onOpenCreatePost} className={styles.createPostButton} title="Crear Momento">
        <PlusSquare className={styles.navIcon} size={32} />
      </button>

      {/* Botón 4: Mensajes (con ícono actualizado) */}
      <button 
        className={styles.navItem} 
        title="Mensajes (Próximamente)"
        onClick={handleMessagesClick}
      >
        <MessagesSquare className={styles.navIcon} size={28} />
      </button>

      <NavLink to="/dashboard/notifications" className={getNavLinkClass} title="Notificaciones">
        <Bell className={styles.navIcon} size={28} />
        {notificationCount > 0 && (
          <span className={styles.notificationBadge}>
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </NavLink>
    </nav>
  );
}

export default BottomNavBar;