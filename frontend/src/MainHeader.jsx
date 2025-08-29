// frontend/src/MainHeader.jsx
// Versión 2.7: Reemplaza los CornerButton por una barra de control inferior con botones de acción circulares.

import React, { useState, useRef, useEffect } from 'react';
import { Trophy, LayoutGrid, X } from 'lucide-react';

import styles from './MainHeader.module.css';

// Importamos solo los componentes de las vistas. CornerButton ha sido eliminado.
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
    const refs = {
      default: defaultRef,
      management: managementRef,
      missions: missionsRef,
    };
    const targetHeight = refs[viewMode]?.current?.offsetHeight || 0;
    
    if (targetHeight > 0) {
      setMinHeight(`${targetHeight}px`);
    }
  }, [viewMode, userProfile, pets]);

  const handleToggle = (targetMode) => {
    setViewMode(currentMode => {
      if (currentMode === targetMode) {
        setLastViewMode(currentMode);
        return 'default';
      }
      setLastViewMode(currentMode);
      return targetMode;
    });
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
      
      {/* ----- INICIO DE LA MODIFICACIÓN ----- */}
      {/* Se eliminan los CornerButton y se reemplazan por la nueva barra de control. */}
      <div className={styles.bottomControlBar}>
        <button 
          className={styles.actionButton}
          onClick={handleToggleMissions}
          aria-label="Alternar vista de misiones"
        >
          <MissionsIcon size={26} />
        </button>

        <h1 className={styles.brandTitle}>enlapet</h1>

        <button 
          className={styles.actionButton}
          onClick={handleToggleManagement}
          aria-label="Alternar vista de gestión"
        >
          <ManagementIcon size={26} />
        </button>
      </div>
      {/* ----- FIN DE LA MODIFICACIÓN ----- */}
    </header>
  );
}

export default MainHeader;