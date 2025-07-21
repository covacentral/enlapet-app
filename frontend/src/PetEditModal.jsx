        // frontend/src/PetEditModal.jsx
        // Versión: 2.2 - Formulario Unificado
        // Combina Info General y Hoja de Vida en un solo formulario para una mejor UX y robustez.
        
        import { useState, useEffect } from 'react';
        import { colombiaData, departments } from './utils/colombiaData';
        import './App.css';
        
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        function PetEditModal({ pet, user, onClose, onUpdate }) {
          const [formData, setFormData] = useState({
            name: '',
            breed: '',
            location: { department: '', city: '' },
            healthRecord: { birthDate: '', gender: '' }
          });
          const [cities, setCities] = useState([]);
          const [isLoading, setIsLoading] = useState(false);
          const [message, setMessage] = useState('');
        
          useEffect(() => {
            if (pet) {
              setFormData({
                name: pet.name || '',
                breed: pet.breed || '',
                location: pet.location || { department: '', city: '' },
                healthRecord: pet.healthRecord || { birthDate: '', gender: '' }
              });
              if (pet.location && pet.location.department) {
                setCities(colombiaData[pet.location.department] || []);
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
                setCities(colombiaData[value] || []);
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
              const payload = {
                name: formData.name,
                breed: formData.breed,
                location: formData.location,
                healthRecord: formData.healthRecord,
              };
        
              const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(payload),
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
        
          if (!pet) return null;
        
          return (
            <>
            <style>{`
              .modal-backdrop {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.7); display: flex;
                justify-content: center; align-items: center; z-index: 1000;
              }
              .modal-content {
                background-color: #2d343f; padding: 1.5rem; border-radius: 12px;
                width: 90%; max-width: 500px; max-height: 90vh;
                overflow-y: auto; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              }
              .form-section-title {
                color: #61dafb; border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 1rem; margin-top: 1.5rem; font-size: 1.1rem;
              }
            `}</style>
            <div className="modal-backdrop" onClick={onClose}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Editar Perfil de {pet.name}</h2>
                  <button onClick={onClose} className="close-button" disabled={isLoading}>×</button>
                </div>
                
                <form onSubmit={handleSaveChanges}>
                  <div className="modal-body">
                    <h3 className="form-section-title">Información General</h3>
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
        
                    <h3 className="form-section-title">Hoja de Vida</h3>
                    <div className="form-group"><label>Fecha de Nacimiento:</label><input type="date" name="healthRecord.birthDate" value={formData.healthRecord.birthDate} onChange={handleChange} disabled={isLoading} /></div>
                    <div className="form-group">
                      <label>Género:</label>
                      <select name="healthRecord.gender" value={formData.healthRecord.gender} onChange={handleChange} disabled={isLoading}>
                        <option value="">No especificado</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option>
                      </select>
                    </div>
                  </div>
        
                  <div className="modal-footer">
                    {message && <p className="response-message">{message}</p>}
                    <button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                  </div>
                </form>
              </div>
            </div>
            </>
          );
        }
        
        export default PetEditModal;
        