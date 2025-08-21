// frontend/src/BottomNavBar.jsx
// Versión 1.6: Reorganiza los botones de navegación según la nueva estructura.
// 'Mapa' -> 'Tienda', 'Eventos' -> 'Mensajes', 'Búsquedas' -> 'Notificaciones'.

import React from 'react';
import { NavLink } from 'react-router-dom';
// 1. Se importan los nuevos íconos y se eliminan los antiguos.
import { Home, ShoppingBag, PlusSquare, Mail, Bell } from 'lucide-react';

import styles from './BottomNavBar.module.css';

// 2. El componente ahora acepta 'notificationCount' para mostrar un indicador.
function BottomNavBar({ onOpenCreatePost, notificationCount }) {
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  const handleMessagesClick = () => {
    alert('Próximamente: Mensajes directos entre usuarios.');
  };

  return (
    <nav className={styles.navBar}>
      {/* Botón 1: Inicio (Sin cambios) */}
      <NavLink to="/dashboard" end className={getNavLinkClass} title="Inicio">
        <Home className={styles.navIcon} size={28} />
      </NavLink>

      {/* Botón 2: Market (Reemplaza a Mapa) */}
      <NavLink to="/dashboard/store/product/ENLAPET_COLLAR_V1" className={getNavLinkClass} title="Tienda">
        <ShoppingBag className={styles.navIcon} size={28} />
      </NavLink>
      
      {/* Botón 3: Crear Momento (Sin cambios) */}
      <button onClick={onOpenCreatePost} className={styles.createPostButton} title="Crear Momento">
        <PlusSquare className={styles.navIcon} size={32} />
      </button>

      {/* Botón 4: Mensajes (Reemplaza a Eventos) */}
      <button 
        className={styles.navItem} 
        title="Mensajes (Próximamente)"
        onClick={handleMessagesClick}
      >
        <Mail className={styles.navIcon} size={28} />
      </button>

      {/* Botón 5: Notificaciones (Reemplaza a Búsquedas Activas) */}
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