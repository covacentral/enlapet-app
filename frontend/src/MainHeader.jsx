// frontend/src/MainHeader.jsx
// Versión 1.1 - Botón para Añadir Mascotas
// AÑADIDO: Se incluye una burbuja "+" en el carrusel para enlazar a la página de gestión de mascotas.

import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import { Plus } from 'lucide-react'; // Importamos el ícono necesario

const PetBubble = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className="pet-bubble" title={pet.name}>
    {pet.petPictureUrl ? <img src={pet.petPictureUrl} alt={pet.name} /> : <span>🐾</span>}
  </Link>
);

// Componente para la nueva burbuja de "Añadir Mascota"
const AddPetBubble = () => (
    <Link to="/dashboard/pets" className="pet-bubble" title="Añadir o gestionar mascotas" style={{backgroundColor: 'var(--border-color)', borderStyle: 'dashed'}}>
        <Plus size={32} color="var(--text-secondary)" />
    </Link>
);

function MainHeader({ userProfile, pets }) {
  if (!userProfile) {
    return null;
  }
  
  const currentUserId = auth.currentUser?.uid;

  return (
    <header className="main-header">
      <div className="user-profile-section">
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
          {/* La burbuja "+" siempre aparece al final del carrusel */}
          <AddPetBubble />
        </div>
      </div>
    </header>
  );
}

export default MainHeader;