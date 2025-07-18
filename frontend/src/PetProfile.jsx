import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- 1. MODIFICAMOS EL BOTÓN DE "ATRÁS" ---
// Ahora será un botón de texto para máxima claridad.
const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate(-1)} className="back-button text-button">
            &larr; Atrás
        </button>
    );
};


const PetPicturePlaceholder = () => (
  <div className="pet-profile-picture-placeholder">
    <span>🐾</span>
  </div>
);

const WhatsAppButton = ({ phoneNumber }) => {
  if (!phoneNumber) return null;

  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanedPhone}`;

  return (
    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-button">
      Contactar por WhatsApp
    </a>
  );
};

function PetProfile() {
  const { petId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPetProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_URL}/api/public/pets/${petId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No se pudo encontrar el perfil de la mascota.');
        }
        
        setProfileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPetProfile();
  }, [petId]);

  if (loading) {
    return <div className="public-profile-container"><h1>Cargando perfil...</h1></div>;
  }

  if (error) {
    return (
      <div className="public-profile-container error-container">
        <BackButton />
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/" className="link-button">Volver al inicio</Link>
      </div>
    );
  }

  if (!profileData) {
    return <div className="public-profile-container"><h1>Perfil no disponible.</h1></div>;
  }

  return (
    <div className="public-profile-container">
      <div className="pet-profile-card">
        <BackButton />
        
        {profileData.pet.petPictureUrl ? (
          <img src={profileData.pet.petPictureUrl} alt={profileData.pet.name} className="pet-profile-picture" />
        ) : (
          <PetPicturePlaceholder />
        )}
        <h1 className="pet-name">{profileData.pet.name}</h1>
        <p className="pet-breed">Raza: {profileData.pet.breed || 'No especificada'}</p>
        
        <div className="owner-info">
          <h2>¡Ayúdame a volver a casa!</h2>
          <p><strong>Mi dueño es:</strong> {profileData.owner.name}</p>
          <p><strong>Su teléfono es:</strong> {profileData.owner.phone || 'No proporcionado'}</p>
          
          <WhatsAppButton phoneNumber={profileData.owner.phone} />
        </div>

        <footer className="profile-footer">
          <p>Gracias por escanear mi placa EnlaPet.</p>
          <Link to="/" className="link-button small">Crear un perfil para mi mascota</Link>
        </footer>
      </div>
    </div>
  );
}

export default PetProfile;
