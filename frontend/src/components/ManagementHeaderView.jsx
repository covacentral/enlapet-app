// frontend/src/components/ManagementHeaderView.jsx
// Versión 1.3: Conecta el evento para abrir el modal de rescate.

import React from 'react';
import { Link } from 'react-router-dom';
import PetManagementCard from './PetManagementCard';
import styles from '../MainHeader.module.css';

const ENLAPET_COLLAR_PRODUCT_ID = "ENLAPET_COLLAR_V1";

const NfcBanner = () => (
    <Link to={`/dashboard/store/product/${ENLAPET_COLLAR_PRODUCT_ID}`} className={styles.nfcBanner}>
        <div>
            <h3 className={styles.nfcBannerTitle}>Protección Inteligente EnlaPet</h3>
            <p className={styles.nfcBannerText}>Activa el collar NFC y mantén a tu mascota siempre segura.</p>
        </div>
    </Link>
);

// --- 1. El componente ahora acepta la prop 'onOpenRescueModal' ---
function ManagementHeaderView({ pets, onOpenRescueModal }) {
  return (
    <div className={styles.managementViewContainer}>
      <NfcBanner />
      <div>
        <h3 className={styles.managementViewTitle}>Mis Mascotas</h3>
        <div className={styles.cardCarousel}>
          {pets && pets.length > 0 ? (
            pets.map(pet => (
              // --- 2. Pasamos la función a cada tarjeta como 'onRescueClick' ---
              <PetManagementCard 
                key={pet.id} 
                pet={pet} 
                onRescueClick={onOpenRescueModal} 
              />
            ))
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