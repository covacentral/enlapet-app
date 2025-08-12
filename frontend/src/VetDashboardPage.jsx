// frontend/src/VetDashboardPage.jsx
// Versión 2.2: Refactorización visual de la pestaña "Pacientes".
// TAREA: Se eleva el componente de búsqueda de pacientes para optimizar el layout.

import React, { useState } from 'react';

import styles from './VetDashboardPage.module.css';
import sharedStyles from './shared.module.css';

// Importamos los componentes de las pestañas existentes
import LinkPatientTab from './VetTabs/LinkPatientTab.jsx';
import MyPatientsTab from './VetTabs/MyPatientsTab.jsx';
import ManageScheduleTab from './VetTabs/ManageScheduleTab.jsx';
import AppointmentsTab from './AppointmentsTab.jsx';

function VetDashboardPage({ userProfile }) {
  const [activeTab, setActiveTab] = useState('patients'); // Cambiado para enfocar nuestro trabajo actual

  // El contenido de cada pestaña ahora se define aquí
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'patients':
        return (
          <>
            {/* --- LÍNEAS MODIFICADAS --- */}
            {/* 1. El título del buscador ahora es responsabilidad de esta página. */}
            {/* 2. El componente LinkPatientTab ya no está dentro de un div, permitiéndole usar el espacio. */}
            <h3>Buscar Paciente por EnlaPet ID (EPID)</h3>
            <LinkPatientTab />

            <div style={{marginTop: '2rem'}}>
              <h3>Mis Pacientes Vinculados</h3>
              <MyPatientsTab />
            </div>
          </>
        );
      case 'schedule':
        return (
            <>
                <ManageScheduleTab />
                <div style={{marginTop: '2rem'}}>
                    <h3>Mi Agenda de Citas</h3>
                    <AppointmentsTab userProfile={userProfile} />
                </div>
            </>
        );
      case 'management':
        return (
            <div className={sharedStyles.emptyStateMessage}>
                <h3>Gestión de Consultorio</h3>
                <p>Próximamente: Aquí podrás editar el perfil público de tu veterinaria, gestionar eventos y más.</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={sharedStyles.tabTitle} style={{ marginBottom: 0 }}>Panel de Veterinario</h2>
      </div>

      <div className={sharedStyles.modalTabs}>
        <button 
          type="button" 
          className={`${sharedStyles.modalTabButton} ${activeTab === 'patients' ? sharedStyles.active : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          Pacientes
        </button>
        <button 
          type="button" 
          className={`${sharedStyles.modalTabButton} ${activeTab === 'schedule' ? sharedStyles.active : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Agenda
        </button>
        <button 
          type="button" 
          className={`${sharedStyles.modalTabButton} ${activeTab === 'management' ? sharedStyles.active : ''}`}
          onClick={() => setActiveTab('management')}
        >
          Gestión
        </button>
      </div>

      <div className={styles.tabContent}>
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default VetDashboardPage;