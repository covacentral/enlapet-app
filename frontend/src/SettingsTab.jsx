// frontend/src/SettingsTab.jsx
// Versión: 2.1 - Estado Unificado
// Refactoriza el manejo del estado del formulario a un único objeto para mayor robustez y corregir el bug de guardado.

import { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function SettingsTab({ user, userProfile, onProfileUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  
  // [REFACTORIZADO] Usamos un único objeto de estado para todo el formulario.
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: ''
  });

  const [message, setMessage] = useState({ text: '', isError: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const populateFields = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || ''
      });
    }
  };

  useEffect(() => {
    populateFields();
  }, [userProfile]);

  // [REFACTORIZADO] Un único manejador de cambios para todos los campos.
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [id]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage({ text: 'Guardando cambios...', isError: false });
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        // [REFACTORIZADO] Enviamos el objeto de estado completo.
        body: JSON.stringify(formData),
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
    const formPayload = new FormData();
    formPayload.append('profilePicture', file);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/profile/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formPayload,
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
            <input type="text" id="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Teléfono de Contacto:</label>
            <input type="tel" id="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: 573001234567" />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Biografía (máx. 70 caracteres):</label>
            <textarea 
              id="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              rows="3"
              maxLength="70"
            ></textarea>
            <small className="char-counter">{formData.bio.length} / 70</small>
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
