// frontend/src/BottomNavBar.jsx
// Versión 1.4: Reemplaza el botón de Notificaciones por el ícono del Carrito de Compras.

import React from 'react';
import { NavLink } from 'react-router-dom';
// 1. Se eliminan Bell y ClipboardList. Se importa Home, Map, PlusSquare, Calendar y el nuevo CartIcon.
import { Home, Map, PlusSquare, Calendar } from 'lucide-react';
import CartIcon from './components/CartIcon'; // Importamos el componente del ícono del carrito

import styles from './BottomNavBar.module.css';

// 2. Se actualizan las props: ya no recibimos unreadCount, ahora recibimos onOpenCart.
function BottomNavBar({ onOpenCreatePost, onOpenCart }) {
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

      <NavLink to="/dashboard/events" className={getNavLinkClass}>
        <Calendar className={styles.navIcon} />
        <span className={styles.navLabel}>Eventos</span>
      </NavLink>

      {/* 3. Se reemplaza el NavLink de notificaciones por un botón que usa nuestro CartIcon */}
      <div className={styles.navItem}>
        <CartIcon onClick={onOpenCart} />
        <span className={styles.navLabel}>Carrito</span>
      </div>
    </nav>
  );
}

export default BottomNavBar;