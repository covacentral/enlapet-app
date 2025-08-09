// frontend/src/VetDashboardPage.jsx
// (REFACTORIZADO) Panel de control para veterinarios con sistema de pestañas.

import { useState } from 'react';

import styles from './VetDashboardPage.module.css';
import sharedStyles from './shared.module.css';

// 1. Importamos todos los componentes de las pestañas
import LinkPatientTab from './VetTabs/LinkPatientTab.jsx';
import MyPatientsTab from './VetTabs/MyPatientsTab.jsx';
import ManageScheduleTab from './VetTabs/ManageScheduleTab.jsx';

function VetDashboardPage() {
  const [activeTab, setActiveTab] = useState('linkPatient');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'linkPatient':
        return <LinkPatientTab />;
      case 'myPatients':
        return <MyPatientsTab />;
      case 'manageSchedule':
        // 2. Reemplazamos el último placeholder con el componente real
        return <ManageScheduleTab />;
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
          className={`${sharedStyles.modalTabButton} ${activeTab === 'linkPatient' ? sharedStyles.active : ''}`}
          onClick={() => setActiveTab('linkPatient')}
        >
          Vincular Paciente
        </button>
        <button 
          type="button" 
          className={`${sharedStyles.modalTabButton} ${activeTab === 'myPatients' ? sharedStyles.active : ''}`}
          onClick={() => setActiveTab('myPatients')}
        >
          Mis Pacientes
        </button>
        <button 
          type="button" 
          className={`${sharedStyles.modalTabButton} ${activeTab === 'manageSchedule' ? sharedStyles.active : ''}`}
          onClick={() => setActiveTab('manageSchedule')}
        >
          Gestionar Agenda
        </button>
      </div>

      <div className={styles.tabContent}>
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default VetDashboardPage;