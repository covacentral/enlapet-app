// frontend/src/MainHeader.jsx
// Versión 2.2: Se asegura de pasar la prop 'onAcceptMission' a la vista de misiones.

import React, { useState, useRef, useEffect } from 'react';
import { Trophy, LayoutGrid, X } from 'lucide-react';

import styles from './MainHeader.module.css';
import sharedStyles from './shared.module.css';

// Importamos los componentes de las vistas y el botón
import CornerButton from './components/CornerButton';
import DefaultHeaderView from './components/DefaultHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';
import MissionsHeaderView from './components/MissionsHeaderView';

// --- 1. La firma del componente ahora incluye 'onAcceptMission' ---
function MainHeader({ userProfile, pets, onAcceptMission }) {
  const [viewMode, setViewMode] = useState('default');
  const [lastViewMode, setLastViewMode] = useState('default');
  
  const [minHeight, setMinHeight] = useState('auto');
  const defaultRef = useRef(null);
  const managementRef = useRef(null);
  const missionsRef = useRef(null);

  useEffect(() => {
    const defaultHeight = defaultRef.current?.offsetHeight || 0;
    const managementHeight = managementRef.current?.offsetHeight || 0;
    const missionsHeight = missionsRef.current?.offsetHeight || 0;
    
    let targetHeight = 0;
    if (viewMode === 'default') targetHeight = defaultHeight;
    else if (viewMode === 'management') targetHeight = managementHeight;
    else if (viewMode === 'missions') targetHeight = missionsHeight;

    if (targetHeight > 0) {
      setMinHeight(`${targetHeight + 50}px`);
    }

  }, [viewMode, userProfile, pets]);

  const handleToggleManagement = () => {
    const newMode = viewMode === 'management' ? 'default' : 'management';
    // Si estamos en la vista de misiones, el botón de gestión nos lleva a 'management'
    if (viewMode === 'missions') {
        setViewMode('management');
        setLastViewMode('management');
    } else {
        setViewMode(newMode);
        setLastViewMode(newMode);
    }
  };

  const handleToggleMissions = () => {
    if (viewMode === 'missions') {
      setViewMode(lastViewMode);
    } else {
      setLastViewMode(viewMode);
      setViewMode('missions');
    }
  };
  
  // Pequeña mejora: pasamos el componente de ícono en lugar de solo el nombre para mayor flexibilidad.
  const ManagementIcon = viewMode === 'management' ? X : LayoutGrid;
  const MissionsIcon = viewMode === 'missions' ? X : Trophy;


  if (!userProfile) {
    return null;
  }

  return (
    <header 
        className={styles.header}
        style={{ minHeight: minHeight, transition: 'min-height 0.4s ease-in-out' }}
    >
      <div ref={defaultRef} className={`${styles.viewWrapper} ${viewMode !== 'default' ? styles.hidden : ''}`}>
        <DefaultHeaderView userProfile={userProfile} pets={pets} />
      </div>

      <div ref={managementRef} className={`${styles.viewWrapper} ${viewMode !== 'management' ? styles.hidden : ''}`}>
        <ManagementHeaderView pets={pets} />
      </div>
      
      <div ref={missionsRef} className={`${styles.viewWrapper} ${viewMode !== 'missions' ? styles.hidden : ''}`}>
        {/* --- 2. Pasamos la prop 'onAcceptMission' al componente hijo --- */}
        <MissionsHeaderView pets={pets} onAcceptMission={onAcceptMission} />
      </div>
      
      <CornerButton 
        position="bottomRight"
        onClick={handleToggleManagement}
        iconComponent={<ManagementIcon size={28} />}
        aria-label="Toggle Management View"
      />
      <CornerButton 
        position="bottomLeft"
        onClick={handleToggleMissions}
        iconComponent={<MissionsIcon size={28} />}
        aria-label="Toggle Missions View"
      />
    </header>
  );
}

// Corregimos un pequeño error en mi implementación anterior del CornerButton para que acepte el componente directamente
const CornerButtonWithIcon = ({ position, iconComponent, onClick, ...props }) => (
    <CornerButton position={position} onClick={onClick} {...props}>
        {iconComponent}
    </CornerButton>
);


export default MainHeader;