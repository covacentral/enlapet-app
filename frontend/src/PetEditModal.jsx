// frontend/src/PetEditModal.jsx

import { useState, useEffect } from 'react';
import { colombiaData, departments } from './utils/colombiaData';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PetEditModal({ pet, user, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    location: { department: '', city: '' },
    healthRecord: { birthDate: '', gender: '' }
  });
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Carga los datos de la mascota en el formulario cuando el modal se abre
  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        breed: pet.breed || '',
        location: pet.location || { department: '', city: '' },
        healthRecord: pet.healthRecord || { birthDate: '', gender: '' }
      });
      // Si ya hay un departamento, carga las ciudades correspondientes
      if (pet.location && pet.location.department) {
        setCities(colombiaData[pet.location.department] || []);
      }
    }
  }, [pet]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    const newLocation = { ...formData.location, [name]: value };

    // Si se cambia el departamento, resetea la ciudad y actualiza la lista de ciudades
    if (name === 'department') {
      newLocation.city = '';
      setCities(colombiaData[value] || []);
    }

    setFormData(prev => ({ ...prev, location: newLocation }));
  };

  const handleHealthRecordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, [name]: value }
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Guardando cambios...');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/pets/${pet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al guardar.');
      
      setMessage('¡Perfil de mascota actualizado!');
      onUpdate(); // Recarga la lista de mascotas
      setTimeout(() => {
        onClose(); // Cierra el modal después de un breve retraso
      }, 1500);

    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pet) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Editar Perfil de {pet.name}</h2>
          <button onClick={onClose} className="close-button" disabled={isLoading}>×</button>
        </div>
        
        <div className="modal-tabs">
          <button onClick={() => setActiveTab('info')} className={activeTab === 'info' ? 'active' : ''}>Info General</button>
          <button onClick={() => setActiveTab('health')} className={activeTab === 'health' ? 'active' : ''}>Hoja de Vida</button>
        </div>

        <form onSubmit={handleSaveChanges}>
          {activeTab === 'info' && (
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="form-group">
                <label>Raza:</label>
                <input type="text" name="breed" value={formData.breed} onChange={handleChange} disabled={isLoading} />
              </div>
              <div className="form-group">
                <label>Departamento:</label>
                <select name="department" value={formData.location.department} onChange={handleLocationChange} disabled={isLoading}>
                  <option value="">Selecciona un departamento</option>
                  {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Ciudad:</label>
                <select name="city" value={formData.location.city} onChange={handleLocationChange} disabled={isLoading || !formData.location.department}>
                  <option value="">Selecciona una ciudad</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="modal-body">
              <div className="form-group">
                <label>Fecha de Nacimiento:</label>
                <input type="date" name="birthDate" value={formData.healthRecord.birthDate} onChange={handleHealthRecordChange} disabled={isLoading} />
              </div>
              <div className="form-group">
                <label>Género:</label>
                <select name="gender" value={formData.healthRecord.gender} onChange={handleHealthRecordChange} disabled={isLoading}>
                  <option value="">No especificado</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
            </div>
          )}

          <div className="modal-footer">
            {message && <p className="response-message">{message}</p>}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PetEditModal;
