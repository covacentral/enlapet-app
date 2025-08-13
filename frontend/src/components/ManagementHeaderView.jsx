// frontend/src/components/ManagementHeaderView.jsx
// Versión 1.2: Convierte el banner en un Link funcional a la página del producto.

import React from 'react';
import { Link } from 'react-router-dom'; // 1. Importamos Link
import PetManagementCard from './PetManagementCard';
import styles from '../MainHeader.module.css';

// ID estático del producto, tal como se definió en ProductPage.jsx
const ENLAPET_COLLAR_PRODUCT_ID = "ENLAPET_COLLAR_V1";

// --- Componente interno del Banner MODIFICADO ---
const NfcBanner = () => (
    // 2. El banner ahora es un componente Link que redirige a la ruta del producto.
    <Link to={`/dashboard/store/product/${ENLAPET_COLLAR_PRODUCT_ID}`} className={styles.nfcBanner}>
        <div>
            <h3 className={styles.nfcBannerTitle}>Protección Inteligente EnlaPet</h3>
            <p className={styles.nfcBannerText}>Activa el collar NFC y mantén a tu mascota siempre segura.</p>
        </div>
    </Link>
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