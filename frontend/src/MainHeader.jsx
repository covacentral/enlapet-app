import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import styles from './MainHeader.module.css';
import DefaultHeaderView from './components/DefaultHeaderView';
import MissionsHeaderView from './components/MissionsHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';
import { Search, Map, Calendar, Bell, ShoppingCart, Trophy, LayoutGrid, X } from 'lucide-react';

const MainHeader = () => {
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [userData, setUserData] = useState(null);
  const [currentView, setCurrentView] = useState('default'); // Lógica de vistas restaurada
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        });

        const petsColRef = collection(db, 'users', currentUser.uid, 'pets');
        const unsubscribePets = onSnapshot(petsColRef, (snapshot) => {
          const petsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPets(petsData);
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

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (!user || !userData) {
    return null;
  }

  const isVerifiedVet = userData.role === 'veterinarian' && userData.isVerified;

  const renderContent = () => {
    switch (currentView) {
      case 'missions':
        return <MissionsHeaderView user={user} />;
      case 'management':
        return <ManagementHeaderView user={user} />;
      default:
        return (
          <DefaultHeaderView
            user={user}
            pets={pets}
            onAddPet={() => handleNavigation('/add-pet')}
          />
        );
    }
  };

  return (
    <header className={styles.header}>
      {/* Barra de Navegación Superior (Funcionalidad Correcta) */}
      <nav className={styles.navBar}>
        <button className={styles.navButton} onClick={() => handleNavigation('/search')}><Search /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/map')}><Map /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/events')}><Calendar /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/notifications')}><Bell /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/store')}><ShoppingCart /></button>
      </nav>

      {/* Contenido Dinámico basado en la Vista */}
      {renderContent()}

      {/* Nueva Barra de Control Inferior (Funcionalidad Correcta) */}
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

      {/* Banner de Acción para Veterinarios Verificados */}
      {isVerifiedVet && (
        <div className={styles.verifiedActionBanner} onClick={() => handleNavigation('/vet-dashboard')}>
          Panel Veterinario
        </div>
      )}
    </header>
  );
};

export default MainHeader;