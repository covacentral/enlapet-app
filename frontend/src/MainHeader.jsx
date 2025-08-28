import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import styles from './MainHeader.module.css';

// Vistas hijas que se renderizan
import MissionsHeaderView from './components/MissionsHeaderView';
import ManagementHeaderView from './components/ManagementHeaderView';

// Iconos necesarios
import { Search, Map, Calendar, Megaphone, Menu, Trophy, LayoutGrid, X } from 'lucide-react';

const MainHeader = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pets, setPets] = useState([]);
  const [currentView, setCurrentView] = useState('default');
  const navigate = useNavigate();

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

  if (!user) return null;

  const isVerifiedVet = userData?.role === 'veterinarian' && userData?.isVerified;
  const getTopNavLinkClass = ({ isActive }) => isActive ? `${styles.topNavButton} ${styles.active}` : styles.topNavButton;

  const renderInnerContent = () => {
    switch (currentView) {
      case 'missions':
        return <MissionsHeaderView pets={pets} />;
      case 'management':
        return <ManagementHeaderView pets={pets} />;
      default:
        return (
          <>
            <div className={styles.topNavBar}>
              <button className={styles.topNavButton} title="Buscar (Próximamente)">
                <Search size={22} />
              </button>
              <NavLink to="/dashboard/map" className={getTopNavLinkClass} title="Mapa Comunitario">
                <Map size={22} />
              </NavLink>
              <NavLink to="/dashboard/events" className={getTopNavLinkClass} title="Eventos">
                <Calendar size={22} />
              </NavLink>
              <NavLink to="/dashboard/rescue" className={getTopNavLinkClass} title="Búsquedas Activas">
                <Megaphone size={22} />
              </NavLink>
              <NavLink to="/dashboard/settings" className={getTopNavLinkClass} title="Ajustes y Menú">
                <Menu size={22} />
              </NavLink>
            </div>
            
            <div className={styles.profilesCarousel}>
              <div className={styles.profileBubble} onClick={() => navigate(`/user/${user.uid}`)}>
                <img src={user.photoURL} alt="Tu Perfil" />
                <span>Tú</span>
              </div>
              {pets.map(pet => (
                <div key={pet.id} className={styles.profileBubble} onClick={() => navigate(`/pet/${pet.id}`)}>
                  {/* CORRECCIÓN DEFINITIVA: Se usa 'pet.photoURL' en lugar de 'pet.petPictureUrl' */}
                  <img src={pet.photoURL} alt={pet.name} />
                  <span>{pet.name}</span>
                </div>
              ))}
              <div className={styles.profileBubble} onClick={() => navigate('/add-pet')}>
                <div className={styles.addPetButton}>+</div>
                <span>Añadir</span>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <header className={styles.header}>
      {renderInnerContent()}
      
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
        <div className={styles.verifiedActionBanner} onClick={() => navigate('/vet-dashboard')}>
          Panel Veterinario
        </div>
      )}
    </header>
  );
};

export default MainHeader;