import { useState, useEffect, useRef } from 'react';
import './App.css';

// --- Lee la URL base de la API desde las variables de entorno ---
const API_URL = import.meta.env.VITE_API_BASE_URL;

function SettingsTab({ user, userProfile, onProfileUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const populateFields = () => {
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
      setBio(userProfile.bio || '');
    }
  };

  useEffect(() => {
    populateFields();
  }, [userProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage({ text: 'Guardando cambios...', isError: false });
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name, phone, bio }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage({ text: 'Perfil guardado con éxito.', isError: false });
      onProfileUpdate();
      setIsEditMode(false);
    } catch (error) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setMessage({ text: 'Subiendo foto...', isError: false });
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/profile/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage({ text: '¡Foto de perfil actualizada!', isError: false });
      onProfileUpdate();
    } catch (error) {
      setMessage({ text: error.message || "Error al subir la foto.", isError: true });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };
  
  const handleCancelEdit = () => {
    populateFields();
    setIsEditMode(false);
    setMessage({ text: '', isError: false });
  };

  return (
    <div className="settings-tab">
      <div className="settings-header">
        <h2>Perfil</h2>
        {!isEditMode && (
          <button onClick={() => setIsEditMode(true)} className="edit-button">
            Editar Perfil
          </button>
        )}
      </div>

      {message.text && (
        <p className={`response-message ${message.isError ? 'error' : 'success'}`}>
          {message.text}
        </p>
      )}

      {isEditMode ? (
        <form onSubmit={handleUpdateProfile} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Teléfono de Contacto:</label>
            <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 573001234567" />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Biografía (máx. 70 caracteres):</label>
            <textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              rows="3"
              maxLength="70"
            ></textarea>
            <small className="char-counter">{bio.length} / 70</small>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" className="cancel-button" onClick={handleCancelEdit} disabled={isUpdating}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="display-profile">
          <div className="profile-info-item"><strong>Nombre:</strong><p>{userProfile?.name || 'No establecido'}</p></div>
          <div className="profile-info-item"><strong>Teléfono:</strong><p>{userProfile?.phone || 'No establecido'}</p></div>
          <div className="profile-info-item"><strong>Biografía:</strong><p>{userProfile?.bio || 'Sin biografía.'}</p></div>
          <div className="profile-picture-section">
            <p>Tu foto de perfil se muestra en la cabecera.</p>
            <button onClick={() => fileInputRef.current.click()} className="upload-button-secondary" disabled={isUploading}>
              {isUploading ? 'Subiendo...' : 'Cambiar Foto de Perfil'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsTab;
