// frontend/src/components/ManagementHeaderView.jsx
// Versión 1.1: Convierte el banner en un único elemento clickeable.

import React from 'react';
import PetManagementCard from './PetManagementCard';
import styles from '../MainHeader.module.css';

// --- Componente interno del Banner MODIFICADO ---
const NfcBanner = () => (
    // 1. El banner ahora es un ancla (<a>) para ser completamente clickeable.
    //    En el futuro, el href apuntará a la página del producto.
    <a href="#" className={styles.nfcBanner}>
        <div>
            <h3 className={styles.nfcBannerTitle}>Protección Inteligente EnlaPet</h3>
            <p className={styles.nfcBannerText}>Activa el collar NFC y mantén a tu mascota siempre segura.</p>
        </div>
        {/* 2. Se elimina el botón explícito de "Conoce más". */}
    </a>
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