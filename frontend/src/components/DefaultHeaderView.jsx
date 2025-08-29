import React from 'react';
import { Link } from 'react-router-dom';
import styles from './DefaultHeaderView.module.css';
import { Compass, Calendar, Search, Menu, Plus } from 'lucide-react';

const DefaultHeaderView = ({ userProfile, pets }) => {
  if (!userProfile) {
    return <div>Cargando perfil...</div>;
  }

  return (
    <div className={styles.defaultViewContainer}>
      <div className={styles.topNavBar}>
        <Link to="/dashboard/map" className={styles.navIcon}><Compass /></Link>
        <Link to="/dashboard/events" className={styles.navIcon}><Calendar /></Link>
        <Link to="/dashboard/lost-and-found" className={styles.navIcon}><Search /></Link>
        <button className={styles.navIcon}><Menu /></button>
      </div>

      <div className={styles.profilesCarouselContainer}>
        {/* User Profile Bubble */}
        <Link to={`/dashboard/user/${userProfile.uid}`} className={`${styles.profileBubble} ${styles.userBubble}`}>
          <img src={userProfile.photoURL} alt={userProfile.name} className={styles.bubbleImage} />
        </Link>

        {/* Pet Bubbles */}
        {pets.map(pet => (
          <Link key={pet.id} to={`/dashboard/pet/${pet.id}`} className={styles.profileBubble}>
            <img src={pet.photoURL} alt={pet.name} className={styles.bubbleImage} />
          </Link>
        ))}

        {/* Add Pet Bubble */}
        <Link to="/dashboard/add-pet" className={`${styles.profileBubble} ${styles.addBubble}`}>
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
};

export default DefaultHeaderView;