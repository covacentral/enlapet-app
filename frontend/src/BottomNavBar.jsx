import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Calendar, Bell, Plus } from 'lucide-react';
import CreatePostModal from './CreatePostModal'; // Asumo que tienes este componente

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
    // El botón de "Crear" se maneja por separado
    { to: '/events', icon: Calendar, label: 'Eventos' },
    { to: '/notifications', icon: Bell, label: 'Alertas' },
  ];

  return (
    <>
      <nav className="bottom-nav-bar">
        {/* Renderiza los dos primeros items */}
        {navItems.slice(0, 2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Botón especial para crear post que abre un modal */}
        <button 
          className="nav-item create-post-button" 
          onClick={() => setIsCreatePostModalOpen(true)}
        >
          <Plus size={30} />
        </button>

        {/* Renderiza los dos últimos items */}
        {navItems.slice(2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
      
      {/* El modal para crear un post se muestra condicionalmente */}
      {isCreatePostModalOpen && (
        <CreatePostModal onClose={() => setIsCreatePostModalOpen(false)} />
      )}
    </>
  );
};

export default BottomNavBar;
