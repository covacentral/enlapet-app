// frontend/src/BottomNavBar.jsx
// Componente de la nueva barra de navegación inferior fija.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, PlusSquare, Calendar, Bell, User } from 'lucide-react';

function BottomNavBar({ unreadCount, onOpenCreatePost }) {
  return (
    <nav className="bottom-nav-bar">
      <NavLink to="/dashboard" end className="nav-item">
        <Home className="nav-icon" />
        <span className="nav-label">Inicio</span>
      </NavLink>
      <NavLink to="/dashboard/map" className="nav-item">
        <Map className="nav-icon" />
        <span className="nav-label">Mapa</span>
      </NavLink>
      
      {/* Botón central para crear post */}
      <button onClick={onOpenCreatePost} className="nav-item">
        <PlusSquare className="nav-icon" size={28} />
      </button>

      <NavLink to="/dashboard/events" className="nav-item">
        <Calendar className="nav-icon" />
        <span className="nav-label">Eventos</span>
      </NavLink>
      <NavLink to="/dashboard/notifications" className="nav-item">
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        <Bell className="nav-icon" />
        <span className="nav-label">Alertas</span>
      </NavLink>
    </nav>
  );
}

export default BottomNavBar;
