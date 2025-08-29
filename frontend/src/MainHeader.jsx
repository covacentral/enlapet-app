import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './MainHeader.module.css';
import DefaultHeaderView from './components/DefaultHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';
import MissionsHeaderView from './components/MissionsHeaderView';
import { Trophy, LayoutGrid } from 'lucide-react';

const MainHeader = ({ userProfile, pets, onAcceptMission, onOpenRescueModal }) => {
  const [viewMode, setViewMode] = useState('default');
  const [minHeight, setMinHeight] = useState('auto');
  const viewContainerRef = useRef(null);
  const contentRefs = {
    default: useRef(null),
    management: useRef(null),
    missions: useRef(null),
  };

  useEffect(() => {
    const updateMinHeight = () => {
      if (contentRefs[viewMode]?.current) {
        const contentHeight = contentRefs[viewMode].current.offsetHeight;
        setMinHeight(`${contentHeight}px`);
      }
    };

    updateMinHeight();
    window.addEventListener('resize', updateMinHeight);
    return () => window.removeEventListener('resize', updateMinHeight);
  }, [viewMode, userProfile, pets]);

  const renderView = () => {
    const views = {
      default: (
        <div ref={contentRefs.default} className={`${styles.viewContent} ${viewMode === 'default' ? styles.fadeIn : styles.fadeOut}`}>
          <DefaultHeaderView userProfile={userProfile} pets={pets} />
        </div>
      ),
      management: (
        <div ref={contentRefs.management} className={`${styles.viewContent} ${viewMode === 'management' ? styles.fadeIn : styles.fadeOut}`}>
          <ManagementHeaderView pets={pets} onOpenRescueModal={onOpenRescueModal} />
        </div>
      ),
      missions: (
        <div ref={contentRefs.missions} className={`${styles.viewContent} ${viewMode === 'missions' ? styles.fadeIn : styles.fadeOut}`}>
          <MissionsHeaderView pets={pets} onAcceptMission={onAcceptMission} />
        </div>
      ),
    };

    return Object.keys(views).map(key => (
      <div key={key} style={{ display: viewMode === key ? 'block' : 'none' }}>
        {views[key]}
      </div>
    ));
  };
  
  return (
    <header className={styles.header}>
      <div ref={viewContainerRef} className={styles.viewContainer} style={{ minHeight }}>
        {renderView()}
      </div>

      <div className={styles.bottomControlBar}>
        <button 
          onClick={() => setViewMode(viewMode === 'missions' ? 'default' : 'missions')} 
          className={styles.actionButton}
          aria-label="Ver misiones"
        >
          <Trophy />
        </button>
        <div className={styles.brandTitle}>enlapet</div>
        <button 
          onClick={() => setViewMode(viewMode === 'management' ? 'default' : 'management')} 
          className={styles.actionButton}
          aria-label="Gestionar mascotas"
        >
          <LayoutGrid />
        </button>
      </div>

      {userProfile?.isVerified && userProfile.accountType === 'vet' && (
        <Link to="/dashboard/vet" className={styles.vetPanelButton}>
          Panel Veterinario
        </Link>
      )}
    </header>
  );
};

export default MainHeader;