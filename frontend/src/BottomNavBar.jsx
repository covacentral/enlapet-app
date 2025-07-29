import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Calendar, Bell, Plus } from 'lucide-react';
import CreatePostModal from './CreatePostModal'; // Asumo que tienes este componente para crear posts

const NavItem = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={24} />
      <span>{label}</span>
    </Link>
  );
};

const BottomNavBar = () => {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const navItems = [
    { to: '/feed', icon: Home, label: 'Inicio' },
    { to: '/map', icon: Map, label: 'Mapa' },
    // El botón de "Crear" es especial, no es un enlace de navegación
    { to: '/events', icon: Calendar, label: 'Eventos' },
    { to: '/notifications', icon: Bell, label: 'Alertas' },
  ];

  return (
    <>
      <nav className="bottom-nav-bar">
        {navItems.slice(0, 2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <button 
          className="nav-item create-post-button" 
          onClick={() => setIsCreatePostModalOpen(true)}
        >
          <Plus size={30} />
        </button>

        {navItems.slice(2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
      
      {/* Renderiza el modal para crear un post si el estado es true */}
      {isCreatePostModalOpen && (
        <CreatePostModal onClose={() => setIsCreatePostModalOpen(false)} />
      )}
    </>
  );
};

export default BottomNavBar;
