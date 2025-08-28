import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import styles from './MainHeader.module.css';

// Vistas que el cerebro puede mostrar
import DefaultHeaderView from './components/DefaultHeaderView';
import MissionsHeaderView from './components/MissionsHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';

// Iconos para los nuevos controles
import { Trophy, LayoutGrid, X, Stethoscope } from 'lucide-react';

const MainHeader = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [currentView, setCurrentView] = useState('default');
  const navigate = useNavigate();

  // Lógica de carga de datos original y funcional
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const petsColRef = collection(db, 'users', currentUser.uid, 'pets');

        const unsubscribeUser = onSnapshot(userDocRef, docSnap => {
          setUserProfile(docSnap.exists() ? docSnap.data() : null);
        });
        const unsubscribePets = onSnapshot(petsColRef, snapshot => {
          setPets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
          unsubscribeUser();
          unsubscribePets();
        };
      } else {
        setUserProfile(null);
        setPets([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (!userProfile) {
    // Muestra un esqueleto de carga o nada mientras se obtienen los datos del perfil
    return <header className={`${styles.header} ${styles.loading}`}></header>;
  }

  const isVerifiedVet = userProfile.verification?.status === 'verified' && userProfile.verification?.type === 'vet';
  const currentUserId = auth.currentUser?.uid;

  const renderContent = () => {
    switch (currentView) {
      case 'missions':
        return <MissionsHeaderView pets={pets} />;
      case 'management':
        return <ManagementHeaderView pets={pets} />;
      default:
        // Pasa los datos correctos a la vista por defecto
        return (
          <DefaultHeaderView
            userProfile={userProfile}
            pets={pets}
            currentUserId={currentUserId}
          />
        );
    }
  };

  return (
    <header className={styles.header}>
      {renderContent()}
      
      {/* 3. NUEVA BARRA DE CONTROL INFERIOR CON LÓGICA ORIGINAL */}
      <div className={styles.controlBar}>
        <button className={styles.actionButton} onClick={() => setCurrentView('missions')} title="Misiones">
          <Trophy />
        </button>
        {currentView === 'default' ? (
          <h1 className={styles.brandTitle} onClick={() => window.scrollTo(0, 0)}>enlapet</h1>
        ) : (
          <button className={styles.closeButton} onClick={() => setCurrentView('default')} title="Cerrar">
            <X />
          </button>
        )}
        <button className={styles.actionButton} onClick={() => setCurrentView('management')} title="Gestión">
          <LayoutGrid />
        </button>
      </div>

      {/* 4. NUEVO BANNER DE ACCIÓN VERIFICADO */}
      {isVerifiedVet && currentView === 'default' && (
        <div className={styles.verifiedActionBanner} onClick={() => navigate('/dashboard/vet-panel')}>
          <Stethoscope size={18} />
          <span>Panel Veterinario</span>
        </div>
      )}
    </header>
  );
};

export default MainHeader;