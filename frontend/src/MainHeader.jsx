// frontend/src/MainHeader.jsx
// Versión 2.0: Refactorizado a un controlador de vistas dinámico.
// TAREA: Implementa la lógica para alternar entre la vista por defecto y la de gestión.

import React, { useState, useRef, useEffect } from 'react';
import styles from './MainHeader.module.css';

// 1. Importamos los nuevos componentes que hemos creado
import CornerButton from './components/CornerButton';
import DefaultHeaderView from './components/DefaultHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';

function MainHeader({ userProfile, pets }) {
  // 2. Estado para controlar la vista activa ('default' o 'management')
  const [viewMode, setViewMode] = useState('default');
  
  // Hooks para medir la altura de cada vista y animar el contenedor
  const [minHeight, setMinHeight] = useState('auto');
  const defaultRef = useRef(null);
  const managementRef = useRef(null);

  useEffect(() => {
    const defaultHeight = defaultRef.current?.offsetHeight || 0;
    const managementHeight = managementRef.current?.offsetHeight || 0;
    
    // Asigna la altura del contenedor basándose en la vista activa para una transición suave
    if (viewMode === 'default') {
        // Añadimos un poco de padding extra para que no se sienta apretado
        if (defaultHeight > 0) setMinHeight(`${defaultHeight + 50}px`);
    } else {
        if (managementHeight > 0) setMinHeight(`${managementHeight + 50}px`);
    }
  }, [viewMode, userProfile, pets]); // Se recalcula si las props cambian

  if (!userProfile) {
    return null;
  }

  return (
    // 3. El header ahora es un contenedor relativo con una altura mínima dinámica
    <header 
        className={styles.header}
        style={{ minHeight: minHeight, transition: 'min-height 0.4s ease-in-out' }}
    >
      {/* Contenedor para la Vista por Defecto */}
      <div ref={defaultRef} className={`${styles.viewWrapper} ${viewMode !== 'default' ? styles.hidden : ''}`}>
        <DefaultHeaderView userProfile={userProfile} pets={pets} />
      </div>

      {/* Contenedor para la Nueva Vista de Gestión */}
      <div ref={managementRef} className={`${styles.viewWrapper} ${viewMode !== 'management' ? styles.hidden : ''}`}>
        <ManagementHeaderView pets={pets} />
      </div>
      
      {/* 4. El Botón de Esquina controla el cambio de estado */}
      <CornerButton 
        position="bottomRight"
        onClick={() => setViewMode(prev => prev === 'default' ? 'management' : 'default')}
        iconName={viewMode === 'default' ? 'LayoutGrid' : 'X'}
      />
    </header>
  );
}

export default MainHeader;