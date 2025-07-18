import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // <--- 1. IMPORTAMOS useNavigate
import './App.css';

// --- Lee la URL base de la API desde las variables de entorno ---
// CORRECCIÓN: Asegúrate de que el nombre de la variable sea el mismo que usamos en otros archivos.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- 2. CREAMOS EL ICONO Y EL BOTÓN DE "ATRÁS" ---
const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate(-1)} className="back-button">
            <BackArrowIcon />
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

  // Limpia el número para asegurar que solo contenga dígitos.
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
        // Usamos la variable API_URL corregida
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
        {/* 3. AÑADIMOS EL BOTÓN DE ATRÁS TAMBIÉN EN LA PANTALLA DE ERROR */}
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
        {/* 4. AÑADIMOS EL BOTÓN DE ATRÁS EN LA TARJETA DEL PERFIL */}
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
