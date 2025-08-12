// frontend/src/components/ManagementHeaderView.jsx
// Versión 1.0: Componente que encapsula la nueva vista de gestión del MainHeader.

import React from 'react';
import PetManagementCard from './PetManagementCard'; // Importamos la tarjeta que ya creamos
import styles from '../MainHeader.module.css'; // Reutilizamos algunos estilos
import sharedStyles from '../shared.module.css';

// Componente interno para el Banner, para mantener el código limpio.
const NfcBanner = () => (
    <div className={styles.nfcBanner}>
        <div>
            <h3 className={styles.nfcBannerTitle}>Protección Inteligente EnlaPet</h3>
            <p className={styles.nfcBannerText}>Activa el collar NFC y mantén a tu mascota siempre segura.</p>
        </div>
        <button className={`${sharedStyles.button} ${styles.nfcBannerButton}`}>
            Conoce más
        </button>
    </div>
);

function ManagementHeaderView({ pets }) {
  return (
    <div className={styles.managementViewContainer}>
      <NfcBanner />
      <div>
        <h3 className={styles.managementViewTitle}>Mis Mascotas</h3>
        <div className={styles.cardCarousel}>
          {pets && pets.length > 0 ? (
            pets.map(pet => <PetManagementCard key={pet.id} pet={pet} />)
          ) : (
            <p className={styles.noPetsHeader} style={{textAlign: 'center', width: '100%'}}>
                Aún no tienes mascotas para gestionar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagementHeaderView;