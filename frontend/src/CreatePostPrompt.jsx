// frontend/src/CreatePostPrompt.jsx
// Versión: 1.1 - Texto de Invitación Mejorado
// Se actualiza el texto para que sea más significativo y alineado con la marca.

import React from 'react';

function CreatePostPrompt({ userProfile, onClick }) {
  if (!userProfile) return null;

  return (
    <div className="create-post-prompt-container" onClick={onClick}>
      <img 
        src={userProfile.profilePictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} 
        alt="Tu perfil" 
        className="prompt-profile-pic"
      />
      <div className="prompt-input-fake">
        Crea un nuevo momento para la comunidad...
      </div>
    </div>
  );
}

export default CreatePostPrompt;
