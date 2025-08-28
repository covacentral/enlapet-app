import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../MainHeader.module.css'; // Los estilos se consolidan en el componente padre

const DefaultHeaderView = ({ user, pets, onAddPet }) => {
  const navigate = useNavigate();

  // Navegador unificado para perfiles
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className={styles.profilesCarousel}>
      {/* Burbuja del Perfil de Usuario (Nuevo Elemento Fijo) */}
      <div className={styles.profileBubble} onClick={() => handleNavigate(`/user/${user.uid}`)}>
        <img src={user?.photoURL} alt="Tu Perfil" />
        <span>Tú</span>
      </div>

      {/* Burbujas de las Mascotas */}
      {pets.map((pet) => (
        <div key={pet.id} className={styles.profileBubble} onClick={() => handleNavigate(`/pet/${pet.id}`)}>
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