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
import { Trophy, LayoutGrid, X } from 'lucide-react';

const MainHeader = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pets, setPets] = useState([]);
  const [currentView, setCurrentView] = useState('default');
  const navigate = useNavigate();

  // Lógica de carga de datos restaurada a su estado original y funcional
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const petsColRef = collection(db, 'users', currentUser.uid, 'pets');

        const unsubscribeUser = onSnapshot(userDocRef, docSnap => {
          setUserData(docSnap.exists() ? docSnap.data() : {});
        });
        const unsubscribePets = onSnapshot(petsColRef, snapshot => {
          setPets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
          unsubscribeUser();
          unsubscribePets();
        };
      } else {
        setUser(null);
        setUserData(null);
        setPets([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (!user) {
    return null; // No mostrar nada si no hay usuario
  }

  const isVerifiedVet = userData?.role === 'veterinarian' && userData?.isVerified;

  // El cerebro decide qué "cara" mostrar
  const renderContent = () => {
    switch (currentView) {
      case 'missions':
        return <MissionsHeaderView pets={pets} />;
      case 'management':
        return <ManagementHeaderView pets={pets} />;
      default:
        // Pasa todos los datos y funciones necesarias a la vista por defecto
        return (
          <DefaultHeaderView
            user={user}
            pets={pets}
            onNavigate={(path) => navigate(path)}
          />
        );
    }
  };

  return (
    <header className={styles.header}>
      {renderContent()}
      
      {/* La nueva barra de control inferior que maneja el cerebro */}
      <div className={styles.controlBar}>
        <button className={styles.actionButton} onClick={() => setCurrentView('missions')}>
          <Trophy />
        </button>
        {currentView === 'default' ? (
          <h1 className={styles.brandTitle}>enlapet</h1>
        ) : (
          <button className={styles.closeButton} onClick={() => setCurrentView('default')}>
            <X />
          </button>
        )}
        <button className={styles.actionButton} onClick={() => setCurrentView('management')}>
          <LayoutGrid />
        </button>
      </div>

      {/* El nuevo banner para veterinarios */}
      {isVerifiedVet && (
        <div className={styles.verifiedActionBanner} onClick={() => navigate('/vet-dashboard')}>
          Panel Veterinario
        </div>
      )}
    </header>
  );
};

export default MainHeader;