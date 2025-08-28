import React from 'react';
import styles from '../MainHeader.module.css';

// Este es ahora un componente puramente presentacional. No tiene lógica propia.
const DefaultHeaderView = ({ user, pets, onNavigateToUser, onNavigateToPet, onAddPet }) => {
  return (
    <div className={styles.profilesCarousel}>
      {/* Burbuja del Perfil de Usuario */}
      <div className={styles.profileBubble} onClick={onNavigateToUser}>
        <img src={user?.photoURL} alt="Tu Perfil" />
        <span>Tú</span>
      </div>

      {/* Burbujas de las Mascotas */}
      {pets.map((pet) => (
        <div key={pet.id} className={styles.profileBubble} onClick={() => onNavigateToPet(pet.id)}>
          <img src={pet.photoURL} alt={pet.name} />
          <span>{pet.name}</span>
        </div>
      ))}

      {/* Botón para Añadir Mascota */}
      <div className={styles.profileBubble} onClick={onAddPet}>
        <div className={styles.addPetButton}>+</div>
        <span>Añadir</span>
      </div>
    </div>
  );
};

export default DefaultHeaderView;