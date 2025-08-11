// frontend/src/VetDashboardPage.jsx
// Versión 2.0: Reestructurado con pestañas consolidadas "Pacientes" y "Agenda".

import React, { useState } from 'react';

import styles from './VetDashboardPage.module.css';
import sharedStyles from './shared.module.css';

// Importamos los componentes de las pestañas existentes
import LinkPatientTab from './VetTabs/LinkPatientTab.jsx';
import MyPatientsTab from './VetTabs/MyPatientsTab.jsx';
import ManageScheduleTab from './VetTabs/ManageScheduleTab.jsx';
import AppointmentsTab from './AppointmentsTab.jsx'; // Necesitamos este para la agenda

function VetDashboardPage({ userProfile }) { // Pasamos userProfile para la AppointmentsTab
  const [activeTab, setActiveTab] = useState('patients');

  // El contenido de cada pestaña ahora se define aquí
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'patients':
        return (
          <>
            {/* El buscador de pacientes va primero */}
            <LinkPatientTab />
            <div style={{marginTop: '2rem'}}>
              <h3>Mis Pacientes Vinculados</h3>
              {/* La lista de pacientes va debajo */}
              <MyPatientsTab />
            </div>
          </>
        );
      case 'schedule':
        return (
            <>
                {/* El gestor de horario irá aquí, modificado para ser desplegable */}
                <ManageScheduleTab />
                <div style={{marginTop: '2rem'}}>
                    <h3>Próximas Citas</h3>
                    {/* La lista de citas va debajo */}
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

      {/* Navegación de Pestañas Actualizada */}
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