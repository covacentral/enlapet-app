// frontend/src/PetProfile.jsx
// Versión 1.1 - Refactorización a CSS Modules
// TAREA: Se implementa el módulo de estilos local para el perfil público (NFC).

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import LoadingComponent from './LoadingComponent.jsx';

// 1. IMPORTAMOS los nuevos módulos de CSS
import styles from './PetProfile.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const BackButton = () => {
    const navigate = useNavigate();
    // Botón "Atrás" ahora usa su propio estilo del módulo
    return (
        <button onClick={() => navigate(-1)} className={styles.backButton}>
            &larr; Atrás
        </button>
    );
};

const PetPicturePlaceholder = () => (
  <div className={styles.placeholder}>
    <span>🐾</span>
  </div>
);

const WhatsAppButton = ({ phoneNumber }) => {
  if (!phoneNumber) return null;

  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanedPhone}`;

  return (
    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
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
    return <LoadingComponent text="Cargando perfil..." />;
  }

  if (error) {
    return (
      <div className={`${styles.container} ${styles.errorContainer}`}>
        <BackButton />
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/" className={sharedStyles.linkButton}>Volver al inicio</Link>
      </div>
    );
  }

  if (!profileData) {
    return <div className={styles.container}><h1>Perfil no disponible.</h1></div>;
  }

  return (
    // 2. APLICAMOS las clases desde el objeto 'styles'
    <div className={styles.container}>
      <div className={styles.card}>
        <BackButton />
        
        {profileData.pet.petPictureUrl ? (
          <img src={profileData.pet.petPictureUrl} alt={profileData.pet.name} className={styles.picture} />
        ) : (
          <PetPicturePlaceholder />
        )}
        <h1 className={styles.name}>{profileData.pet.name}</h1>
        <p className={styles.breed}>Raza: {profileData.pet.breed || 'No especificada'}</p>
        
        <div className={styles.ownerInfo}>
          <h2>¡Ayúdame a volver a casa!</h2>
          <p><strong>Responsable:</strong> {profileData.owner.name}</p>
          <p><strong>Su teléfono es:</strong> {profileData.owner.phone || 'No proporcionado'}</p>
          
          <WhatsAppButton phoneNumber={profileData.owner.phone} />
        </div>

        <footer className={styles.footer}>
          <p>Gracias por escanear mi placa EnlaPet.</p>
          <Link to="/" className={sharedStyles.linkButton} style={{fontSize: '0.8rem'}}>Crear un perfil para mi mascota</Link>
        </footer>
      </div>
    </div>
  );
}

export default PetProfile;