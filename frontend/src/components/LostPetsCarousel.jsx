// frontend/src/components/LostPetsCarousel.jsx
// (NUEVO) Componente que muestra un carrusel horizontal de mascotas extraviadas.

import React from 'react';
import LostPetCard from './LostPetCard';
import styles from './LostPetsCarousel.module.css';

function LostPetsCarousel({ lostPets }) {
  // Si no hay mascotas perdidas, no renderizamos nada.
  if (!lostPets || lostPets.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Ayúdanos a encontrarlos</h3>
      <div className={styles.carousel}>
        {lostPets.map(pet => (
          <LostPetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}

export default LostPetsCarousel;