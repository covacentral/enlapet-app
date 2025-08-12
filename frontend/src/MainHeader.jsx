// frontend/src/MainHeader.jsx
// Versión 2.0: Refactorizado a un controlador de vistas dinámico.

import React, { useState, useRef, useEffect } from 'react';
import styles from './MainHeader.module.css';

import CornerButton from './components/CornerButton';
import DefaultHeaderView from './components/DefaultHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';

function MainHeader({ userProfile, pets }) {
  const [viewMode, setViewMode] = useState('default');
  
  const [minHeight, setMinHeight] = useState('auto');
  const defaultRef = useRef(null);
  const managementRef = useRef(null);

  useEffect(() => {
    const defaultHeight = defaultRef.current?.offsetHeight || 0;
    const managementHeight = managementRef.current?.offsetHeight || 0;
    
    if (viewMode === 'default') {
        if (defaultHeight > 0) setMinHeight(`${defaultHeight + 50}px`);
    } else {
        if (managementHeight > 0) setMinHeight(`${managementHeight + 50}px`);
    }
  }, [viewMode, userProfile, pets]); 

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
      
      <CornerButton 
        position="bottomRight"
        onClick={() => setViewMode(prev => prev === 'default' ? 'management' : 'default')}
        iconName={viewMode === 'default' ? 'LayoutGrid' : 'X'}
      />
    </header>
  );
}

export default MainHeader;