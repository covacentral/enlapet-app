// frontend/src/MainHeader.jsx
// Versión 2.9: Alinea los nombres de clase con el nuevo CSS del diseño vibrante.

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, LayoutGrid, X, Stethoscope } from 'lucide-react';

import styles from './MainHeader.module.css';

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

  const isVerifiedVet = userProfile?.verification?.status === 'verified' && userProfile?.verification?.type === 'vet';

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
      
      {/* CAMBIO: Se actualiza el className a .controlBar */}
      <div className={styles.controlBar}>
        <button 
          className={styles.actionButton}
          onClick={handleToggleMissions}
          aria-label="Alternar vista de misiones"
        >
          <MissionsIcon size={24} />
        </button>

        <h1 className={styles.brandTitle}>enlapet</h1>

        <button 
          className={styles.actionButton}
          onClick={handleToggleManagement}
          aria-label="Alternar vista de gestión"
        >
          <ManagementIcon size={24} />
        </button>
      </div>
      
      {isVerifiedVet && (
        // CAMBIO: Se actualiza el className a .verifiedActionBanner
        <Link to="/dashboard/vet-panel" className={styles.verifiedActionBanner}>
            <Stethoscope size={18} />
            Panel Veterinario
        </Link>
      )}
    </header>
  );
}

export default MainHeader;