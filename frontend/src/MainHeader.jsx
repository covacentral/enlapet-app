// frontend/src/MainHeader.jsx
// Componente que restaura la cabecera de presentación del usuario y sus mascotas.

import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase'; // Importamos auth para obtener el UID del usuario actual

const PetBubble = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className="pet-bubble" title={pet.name}>
    {pet.petPictureUrl ? <img src={pet.petPictureUrl} alt={pet.name} /> : <span>🐾</span>}
  </Link>
);

function MainHeader({ userProfile, pets }) {
  // Evitar renderizar si los datos aún no están listos
  if (!userProfile) {
    return null;
  }
  
  const currentUserId = auth.currentUser?.uid;

  return (
    <header className="main-header">
      <div className="user-profile-section">
        {/* Enlace al perfil del usuario actual */}
        <Link to={`/dashboard/user/${currentUserId}`} style={{textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
            <h2>{userProfile.name}</h2>
            <div className="profile-picture-container">
              {userProfile.profilePictureUrl ? (
                <img src={userProfile.profilePictureUrl} alt="Perfil" className="profile-picture" />
              ) : (
                <div className="profile-picture-placeholder">👤</div>
              )}
            </div>
            <p className="profile-bio">{userProfile.bio || 'Sin biografía.'}</p>
        </Link>
      </div>
      <div className="user-pets-section">
        <h1 className="header-brand-title">enlapet</h1>
        <div className="pet-bubbles-container">
          {pets && pets.length > 0 ? (
            pets.map(pet => <PetBubble key={pet.id} pet={pet} />)
          ) : (
            <p className="no-pets-header">Añade tu primera mascota</p>
          )}
        </div>
      </div>
    </header>
  );
}

export default MainHeader;
