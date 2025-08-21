// frontend/src/MainHeader.jsx
// Versión 2.6: Limpia el componente principal, que ahora delega la barra de navegación superior a DefaultHeaderView.

import React, { useState, useRef, useEffect } from 'react';
import { Trophy, LayoutGrid, X } from 'lucide-react';

import styles from './MainHeader.module.css';

// Importamos los componentes de las vistas y el botón
import CornerButton from './components/CornerButton';
import DefaultHeaderView from './components/DefaultHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';
import MissionsHeaderView from './components/MissionsHeaderView';

function MainHeader({ userProfile, pets, onAcceptMission, onOpenRescueModal }) {
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
      setMinHeight(`${targetHeight}px`);
    }
  }, [viewMode, userProfile, pets]);

  const handleToggle = (targetMode) => {
    if (viewMode === targetMode) {
      setViewMode(lastViewMode === targetMode ? 'default' : lastViewMode);
    } else {
      setLastViewMode(viewMode);
      setViewMode(targetMode);
    }
  };

  const handleToggleManagement = () => handleToggle('management');
  const handleToggleMissions = () => handleToggle('missions');

  const ManagementIcon = viewMode === 'management' ? X : LayoutGrid;
  const MissionsIcon = viewMode === 'missions' ? X : Trophy;

  return (
    <header 
      className={styles.header}
      style={{ minHeight, transition: 'min-height 0.4s ease-in-out' }}
    >
      {/* Contenedor para las vistas intercambiables */}
      <div className={styles.mainHeaderContent}>
        <div ref={defaultRef} className={`${styles.viewWrapper} ${viewMode !== 'default' ? styles.hidden : ''}`}>
          <DefaultHeaderView userProfile={userProfile} pets={pets} />
        </div>

        <div ref={managementRef} className={`${styles.viewWrapper} ${viewMode !== 'management' ? styles.hidden : ''}`}>
          <ManagementHeaderView pets={pets} onOpenRescueModal={onOpenRescueModal} />
        </div>
        
        <div ref={missionsRef} className={`${styles.viewWrapper} ${viewMode !== 'missions' ? styles.hidden : ''}`}>
          <MissionsHeaderView pets={pets} onAcceptMission={onAcceptMission} />
        </div>
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

export default MainHeader;