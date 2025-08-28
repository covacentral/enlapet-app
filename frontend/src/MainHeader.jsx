import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from './firebase'; // CORREGIDO: 'db' cambiado a 'firestore'
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import styles from './MainHeader.module.css';
import DefaultHeaderView from './components/DefaultHeaderView';
import { Search, Map, Calendar, Bell, ShoppingCart, Trophy, LayoutGrid } from 'lucide-react';

const MainHeader = () => {
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(firestore, 'users', currentUser.uid); // CORREGIDO: 'db' cambiado a 'firestore'
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }

        const petsColRef = collection(firestore, 'users', currentUser.uid, 'pets'); // CORREGIDO: 'db' cambiado a 'firestore'
        const unsubscribePets = onSnapshot(petsColRef, (snapshot) => {
          const petsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPets(petsData);
        });
        return () => unsubscribePets();
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
    return null; // O un componente de carga esqueleto
  }

  const isVerifiedVet = userData.role === 'veterinarian' && userData.isVerified;

  return (
    <header className={styles.header}>
      {/* Barra de Navegación Superior (Sin Cambios) */}
      <nav className={styles.navBar}>
        <button className={styles.navButton} onClick={() => handleNavigation('/search')}><Search /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/map')}><Map /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/events')}><Calendar /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/notifications')}><Bell /></button>
        <button className={styles.navButton} onClick={() => handleNavigation('/store')}><ShoppingCart /></button>
      </nav>

      {/* Carrusel de Perfiles (Renderizado por DefaultHeaderView) */}
      <DefaultHeaderView
        user={user}
        pets={pets}
        onAddPet={() => handleNavigation('/add-pet')}
      />

      {/* Nueva Barra de Control Inferior */}
      <div className={styles.controlBar}>
        <button className={styles.actionButton} onClick={() => handleNavigation('/missions')}>
          <Trophy />
        </button>
        <h1 className={styles.brandTitle}>enlapet</h1>
        <button className={styles.actionButton} onClick={() => handleNavigation('/management')}>
          <LayoutGrid />
        </button>
      </div>

      {/* Nuevo Banner de Acción para Veterinarios Verificados */}
      {isVerifiedVet && (
        <div className={styles.verifiedActionBanner} onClick={() => handleNavigation('/vet-dashboard')}>
          Panel Veterinario
        </div>
      )}
    </header>
  );
};

export default MainHeader;