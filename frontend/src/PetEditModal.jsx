// frontend/src/PetEditModal.jsx
// Versión: 3.1 - Corrección de Lógica de Datos
// CORRECCIÓN: Se revierte la lógica de búsqueda de ciudades a la versión estable que usa
// el array de datos de Colombia, solucionando el crash de la pantalla en blanco.

import { useState, useEffect, useRef } from 'react';
import { colombiaData, departments } from './utils/colombiaData';
import { auth } from './firebase';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PetEditModal({ pet, user, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    location: { department: '', city: '' },
    healthRecord: { birthDate: '', gender: '' }
  });
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        breed: pet.breed || '',
        location: pet.location || { department: '', city: '' },
        healthRecord: pet.healthRecord || { birthDate: '', gender: '' }
      });
      // [CORRECCIÓN] Se usa la lógica correcta para encontrar las ciudades
      if (pet.location && pet.location.department) {
        const departmentData = colombiaData.find(d => d.departamento === pet.location.department);
        setCities(departmentData ? departmentData.ciudades : []);
      }
    }
  }, [pet]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');

    if (section === 'healthRecord' || section === 'location') {
      const newSectionData = { ...formData[section], [field]: value };
      if (name === 'location.department') {
        newSectionData.city = '';
        // [CORRECCIÓN] Se usa la lógica correcta para actualizar las ciudades al cambiar el departamento
        const departmentData = colombiaData.find(d => d.departamento === value);
        setCities(departmentData ? departmentData.ciudades : []);
      }
      setFormData(prev => ({ ...prev, [section]: newSectionData }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Guardando cambios...');
    try {
      const idToken = await user.getIdToken();
      const endpoint = `${API_URL}/api/pets/${pet.id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al guardar.');
      
      setMessage('¡Perfil actualizado con éxito!');
      onUpdate();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setMessage('Subiendo foto...');
    const formPayload = new FormData();
    formPayload.append('petPicture', file);
    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/pets/${pet.id}/picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
            body: formPayload,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setMessage('¡Foto actualizada!');
        onUpdate();
    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  if (!pet) return null;

  return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="pet-edit-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Editar Perfil de {pet.name}</h2>
            <button onClick={onClose} className="close-button" disabled={isLoading || isUploading}>×</button>
          </div>
          
          <form onSubmit={handleSaveChanges}>
            <div className="modal-body">
              <div className="modal-tabs">
                <button type="button" className={`modal-tab-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                  Perfil
                </button>
                <button type="button" className={`modal-tab-button ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>
                  Carné de Salud
                </button>
              </div>

              {activeTab === 'profile' && (
                <>
                  <h3 className="form-section-title">Información General</h3>
                  <div className="form-group">
                      <label>Foto de Perfil:</label>
                      <button type="button" onClick={() => fileInputRef.current.click()} className="upload-button-secondary" disabled={isUploading}>
                          {isUploading ? 'Subiendo...' : 'Cambiar Foto'}
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                  </div>
                  <div className="form-group"><label>Nombre:</label><input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} /></div>
                  <div className="form-group"><label>Raza:</label><input type="text" name="breed" value={formData.breed} onChange={handleChange} disabled={isLoading} /></div>
                  <div className="form-group">
                    <label>Departamento:</label>
                    <select name="location.department" value={formData.location.department} onChange={handleChange} disabled={isLoading}>
                      <option value="">Selecciona un departamento</option>
                      {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ciudad:</label>
                    <select name="location.city" value={formData.location.city} onChange={handleChange} disabled={isLoading || !formData.location.department}>
                      <option value="">Selecciona una ciudad</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'health' && (
                <>
                  <h3 className="form-section-title">Datos Básicos</h3>
                  <div className="form-group"><label>Fecha de Nacimiento:</label><input type="date" name="healthRecord.birthDate" value={formData.healthRecord.birthDate} onChange={handleChange} disabled={isLoading} /></div>
                  <div className="form-group">
                    <label>Género:</label>
                    <select name="healthRecord.gender" value={formData.healthRecord.gender} onChange={handleChange} disabled={isLoading}>
                      <option value="">No especificado</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option>
                    </select>
                  </div>
                  <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0'}}>
                    <p>Próximamente: Registro de Vacunas e Historial Clínico.</p>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              {message && <p className="response-message">{message}</p>}
              <button type="submit" className="publish-button" disabled={isLoading || isUploading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default PetEditModal;
