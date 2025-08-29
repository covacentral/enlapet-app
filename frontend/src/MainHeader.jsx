// frontend/src/MainHeader.jsx
// Versión Final: Aplica el nuevo diseño visual sobre la arquitectura funcional original.

import React, { useState, useRef, useEffect } from 'react';
import { Trophy, LayoutGrid, X, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';

import styles from './MainHeader.module.css';

// Importamos los componentes de las vistas
import DefaultHeaderView from './components/DefaultHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';
import MissionsHeaderView from './components/MissionsHeaderView';

function MainHeader({ userProfile, pets, onAcceptMission, onOpenRescueModal }) {
  const [viewMode, setViewMode] = useState('default');
  const [minHeight, setMinHeight] = useState('auto');
  const viewContainerRef = useRef(null);
  const navigate = useNavigate();

  // Calcula la altura del contenedor para una transición suave
  useEffect(() => {
    if (viewContainerRef.current) {
      const currentViewElement = viewContainerRef.current.querySelector(`.${styles.viewWrapper}:not(.${styles.hidden})`);
      if (currentViewElement) {
        setMinHeight(`${currentViewElement.offsetHeight}px`);
      }
    }
  }, [viewMode, userProfile, pets]);

  const handleViewChange = (targetMode) => {
    setViewMode(prevMode => (prevMode === targetMode ? 'default' : targetMode));
  };
  
  const isVerifiedVet = userProfile?.verification?.status === 'verified' && userProfile.verification?.type === 'vet';

  return (
    <header 
      className={styles.header}
      style={{ minHeight: viewMode === 'default' ? 'auto' : minHeight }} // Altura dinámica solo para vistas no default
    >
      {/* Contenedor para las vistas intercambiables */}
      <div ref={viewContainerRef} className={styles.mainHeaderContent}>
        <div className={`${styles.viewWrapper} ${viewMode !== 'default' ? styles.hidden : ''}`}>
          <DefaultHeaderView userProfile={userProfile} pets={pets} />
        </div>
        <div className={`${styles.viewWrapper} ${viewMode !== 'management' ? styles.hidden : ''}`}>
          <ManagementHeaderView pets={pets} onOpenRescueModal={onOpenRescueModal} />
        </div>
        <div className={`${styles.viewWrapper} ${viewMode !== 'missions' ? styles.hidden : ''}`}>
          <MissionsHeaderView pets={pets} onAcceptMission={onAcceptMission} />
        </div>
      </div>
      
      {/* 3. NUEVA BARRA DE CONTROL INFERIOR */}
      <div className={styles.controlBar}>
        <button className={styles.actionButton} onClick={() => handleViewChange('missions')} title="Misiones">
          <Trophy />
        </button>
        {viewMode === 'default' ? (
          <h1 className={styles.brandTitle}>enlapet</h1>
        ) : (
          <button className={styles.closeButton} onClick={() => setViewMode('default')} title="Cerrar">
            <X />
          </button>
        )}
        <button className={styles.actionButton} onClick={() => handleViewChange('management')} title="Gestión">
          <LayoutGrid />
        </button>
      </div>

      {/* 4. NUEVO BANNER DE ACCIÓN VERIFICADO */}
      {isVerifiedVet && viewMode === 'default' && (
        <div className={styles.verifiedActionBanner} onClick={() => navigate('/dashboard/vet-panel')}>
          <Stethoscope size={18} />
          <span>Panel Veterinario</span>
        </div>
      )}
    </header>
  );
}

export default MainHeader;