// frontend/src/MainHeader.jsx
// Versión 2.1: Integra la vista de Misiones, convirtiéndose en un controlador de 3 vistas.

import React, { useState, useRef, useEffect } from 'react';
import { Trophy } from 'lucide-react'; // 1. Importamos el nuevo ícono para Misiones

import styles from './MainHeader.module.css';

// Importamos los componentes de las vistas y el botón
import CornerButton from './components/CornerButton';
import DefaultHeaderView from './components/DefaultHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';
import MissionsHeaderView from './components/MissionsHeaderView'; // 2. Importamos la nueva vista de Misiones

function MainHeader({ userProfile, pets, onAcceptMission }) {
  // 3. El estado ahora maneja 3 vistas. Guardamos la vista anterior para un toggle inteligente.
  const [viewMode, setViewMode] = useState('default');
  const [lastViewMode, setLastViewMode] = useState('default');
  
  // Referencias para medir la altura de cada vista y animar el contenedor
  const [minHeight, setMinHeight] = useState('auto');
  const defaultRef = useRef(null);
  const managementRef = useRef(null);
  const missionsRef = useRef(null); // 4. Nueva referencia para la vista de misiones

  useEffect(() => {
    const defaultHeight = defaultRef.current?.offsetHeight || 0;
    const managementHeight = managementRef.current?.offsetHeight || 0;
    const missionsHeight = missionsRef.current?.offsetHeight || 0;
    
    // 5. La lógica de altura ahora considera las 3 vistas posibles
    let targetHeight = 0;
    if (viewMode === 'default') targetHeight = defaultHeight;
    else if (viewMode === 'management') targetHeight = managementHeight;
    else if (viewMode === 'missions') targetHeight = missionsHeight;

    if (targetHeight > 0) {
      // Usamos la altura del contenido + el padding del contenedor del header
      setMinHeight(`${targetHeight + 50}px`);
    }

  }, [viewMode, userProfile, pets]); // Se recalcula si las props o la vista cambian

  // 6. Nuevos handlers para una navegación clara entre las 3 vistas
  const handleToggleManagement = () => {
    const newMode = viewMode === 'management' ? 'default' : 'management';
    setViewMode(newMode);
    setLastViewMode(newMode);
  };

  const handleToggleMissions = () => {
    if (viewMode === 'missions') {
      setViewMode(lastViewMode); // Vuelve a la última vista activa (default o management)
    } else {
      setLastViewMode(viewMode); // Guarda la vista actual antes de cambiar
      setViewMode('missions');
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <header 
        className={styles.header}
        style={{ minHeight: minHeight, transition: 'min-height 0.4s ease-in-out' }}
    >
      {/* Contenedor para la Vista por Defecto */}
      <div ref={defaultRef} className={`${styles.viewWrapper} ${viewMode !== 'default' ? styles.hidden : ''}`}>
        <DefaultHeaderView userProfile={userProfile} pets={pets} />
      </div>

      {/* Contenedor para la Vista de Gestión */}
      <div ref={managementRef} className={`${styles.viewWrapper} ${viewMode !== 'management' ? styles.hidden : ''}`}>
        <ManagementHeaderView pets={pets} />
      </div>

      {/* 7. [NUEVO] Contenedor para la Vista de Misiones */}
      <div ref={missionsRef} className={`${styles.viewWrapper} ${viewMode !== 'missions' ? styles.hidden : ''}`}>
        <MissionsHeaderView pets={pets} onAcceptMission={onAcceptMission} />
      </div>
      
      {/* Botones de control de vistas */}
      <CornerButton 
        position="bottomRight"
        onClick={handleToggleManagement}
        iconName={viewMode === 'management' ? 'X' : 'LayoutGrid'}
        aria-label="Toggle Management View"
      />
      <CornerButton 
        position="bottomLeft"
        onClick={handleToggleMissions}
        iconComponent={<Trophy size={28} />} // Pasamos el componente de ícono directamente
        aria-label="Toggle Missions View"
      />
    </header>
  );
}

export default MainHeader;