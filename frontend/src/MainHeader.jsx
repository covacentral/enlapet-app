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
  const [currentView, setCurrentView] = useState('default');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({}); // Si el doc no existe, usar un objeto vacío para evitar errores
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

  const handleNavigate = (path) => {
    navigate(path);
  };

  // El componente solo se renderiza si tenemos la información mínima necesaria (el usuario de auth)
  if (!user) {
    return null;
  }

  // CÓDIGO DEFENSIVO: Se accede a las propiedades de forma segura con '?.'
  // Esto previene el error si 'userData' es null o si 'role' no existe.
  const isVerifiedVet = userData?.role === 'veterinarian' && userData?.isVerified === true;

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
            onNavigateToUser={() => handleNavigate(`/user/${user.uid}`)}
            onNavigateToPet={(petId) => handleNavigate(`/pet/${petId}`)}
            onAddPet={() => handleNavigate('/add-pet')}
          />
        );
    }
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navBar}>
        <button className={styles.navButton} onClick={() => handleNavigate('/search')}><Search /></button>
        <button className={styles.navButton} onClick={() => handleNavigate('/map')}><Map /></button>
        <button className={styles.navButton} onClick={() => handleNavigate('/events')}><Calendar /></button>
        <button className={styles.navButton} onClick={() => handleNavigate('/notifications')}><Bell /></button>
        <button className={styles.navButton} onClick={() => handleNavigate('/store')}><ShoppingCart /></button>
      </nav>

      {renderContent()}

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

      {isVerifiedVet && (
        <div className={styles.verifiedActionBanner} onClick={() => handleNavigate('/vet-dashboard')}>
          Panel Veterinario
        </div>
      )}
    </header>
  );
};

export default MainHeader;