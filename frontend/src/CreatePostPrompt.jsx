// frontend/src/CreatePostPrompt.jsx
// Versión: 1.2 - Refactorización a CSS Modules
// TAREA: Se implementa el módulo de estilos local para restaurar la apariencia del componente.

import React from 'react';

// 1. IMPORTAMOS el nuevo módulo de estilos
import styles from './CreatePostPrompt.module.css';

function CreatePostPrompt({ userProfile, onClick }) {
  if (!userProfile) return null;

  return (
    // 2. APLICAMOS las clases desde el objeto 'styles'
    <div className={styles.container} onClick={onClick}>
      <img 
        src={userProfile.profilePictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} 
        alt="Tu perfil" 
        className={styles.profilePic}
      />
      <div className={styles.fakeInput}>
        Crea un nuevo momento para la comunidad...
      </div>
    </div>
  );
}

export default CreatePostPrompt;