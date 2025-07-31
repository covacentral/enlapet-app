// frontend/src/PetEditModal.jsx
// Versión: 3.5 - Corrección Final de Estilos de Botón
// TAREA: Se aplican las clases correctas del sistema de botones compartidos a todos los botones.

import { useState, useEffect, useRef } from 'react';
import { colombiaData, departments } from './utils/colombiaData';
import { auth } from './firebase';
import { Plus, Trash2 } from 'lucide-react';

import styles from './PetEditModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AddVaccineForm = ({ onSave, onCancel }) => {
  const [vaccine, setVaccine] = useState({ name: '', date: '', nextDate: '' });
  const handleChange = (e) => setVaccine({ ...vaccine, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (vaccine.name && vaccine.date) {
      onSave({ ...vaccine, id: crypto.randomUUID() });
    }
  };

  return (
    <div className={styles.addRecordForm}>
      <div className={sharedStyles.formGroup}>
        <label>Nombre de la Vacuna</label>
        <input type="text" name="name" value={vaccine.name} onChange={handleChange} required />
      </div>
      <div className={sharedStyles.formRow}>
        <div className={sharedStyles.formGroup}>
          <label>Fecha de Aplicación</label>
          <input type="date" name="date" value={vaccine.date} onChange={handleChange} required />
        </div>
        <div className={sharedStyles.formGroup}>
          <label>Próximo Refuerzo (Opcional)</label>
          <input type="date" name="nextDate" value={vaccine.nextDate} onChange={handleChange} />
        </div>
      </div>
      <div className={styles.addRecordFormActions}>
        {/* --- LÍNEAS CORREGIDAS --- */}
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={onCancel}>Cancelar</button>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
};

const AddMedicalHistoryForm = ({ onSave, onCancel }) => {
  const [entry, setEntry] = useState({ title: '', date: '', description: '' });
  const handleChange = (e) => setEntry({ ...entry, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (entry.title && entry.date) {
      onSave({ ...entry, id: crypto.randomUUID() });
    }
  };

  return (
    <div className={styles.addRecordForm}>
      <div className={sharedStyles.formGroup}>
        <label>Motivo o Título</label>
        <input type="text" name="title" value={entry.title} onChange={handleChange} required />
      </div>
      <div className={sharedStyles.formGroup}>
        <label>Fecha</label>
        <input type="date" name="date" value={entry.date} onChange={handleChange} required />
      </div>
      <div className={sharedStyles.formGroup}>
        <label>Descripción (Opcional)</label>
        <textarea name="description" rows="3" value={entry.description} onChange={handleChange}></textarea>
      </div>
      <div className={styles.addRecordFormActions}>
        {/* --- LÍNEAS CORREGIDAS --- */}
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={onCancel}>Cancelar</button>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
};


function PetEditModal({ pet, user, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    location: { department: '', city: '' },
    healthRecord: { 
      birthDate: '', 
      gender: '',
      vaccines: [],
      medicalHistory: [] 
    }
  });
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        breed: pet.breed || '',
        location: pet.location || { department: '', city: '' },
        healthRecord: {
          birthDate: pet.healthRecord?.birthDate || '',
          gender: pet.healthRecord?.gender || '',
          vaccines: pet.healthRecord?.vaccines || [],
          medicalHistory: pet.healthRecord?.medicalHistory || []
        }
      });
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
        const departmentData = colombiaData.find(d => d.departamento === value);
        setCities(departmentData ? departmentData.ciudades : []);
      }
      setFormData(prev => ({ ...prev, [section]: newSectionData }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddVaccine = (vaccine) => {
    const updatedVaccines = [...formData.healthRecord.vaccines, vaccine];
    setFormData(prev => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, vaccines: updatedVaccines }
    }));
    setShowAddVaccine(false);
  };

  const handleRemoveVaccine = (vaccineId) => {
    const updatedVaccines = formData.healthRecord.vaccines.filter(v => v.id !== vaccineId);
    setFormData(prev => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, vaccines: updatedVaccines }
    }));
  };

  const handleAddMedicalHistory = (entry) => {
    const updatedHistory = [...formData.healthRecord.medicalHistory, entry];
    setFormData(prev => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, medicalHistory: updatedHistory }
    }));
    setShowAddHistory(false);
  };

  const handleRemoveMedicalHistory = (entryId) => {
    const updatedHistory = formData.healthRecord.medicalHistory.filter(h => h.id !== entryId);
    setFormData(prev => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, medicalHistory: updatedHistory }
    }));
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
      <div className={sharedStyles.modalBackdrop} onClick={onClose}>
        <div className={styles.content} onClick={e => e.stopPropagation()}>
          <div className={sharedStyles.modalHeader} style={{borderBottom: 'none'}}>
            <h2>Editar Perfil de {pet.name}</h2>
            <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading || isUploading}>X</button>
          </div>
          
          <form onSubmit={handleSaveChanges}>
            <div className={sharedStyles.modalTabs} style={{padding: '0 24px'}}>
              <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'profile' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('profile')}>
                Perfil
              </button>
              <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'health' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('health')}>
                Carné de Salud
              </button>
            </div>

            <div className={styles.body}>
              {activeTab === 'profile' && (
                <>
                  <div className={sharedStyles.formGroup}>
                      <label>Foto de Perfil:</label>
                      <button type="button" onClick={() => fileInputRef.current.click()} className={`${sharedStyles.button} ${sharedStyles.secondary}`} disabled={isUploading}>
                          {isUploading ? 'Subiendo...' : 'Cambiar Foto'}
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                  </div>
                  <div className={sharedStyles.formGroup}><label>Nombre:</label><input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} /></div>
                  <div className={sharedStyles.formGroup}><label>Raza:</label><input type="text" name="breed" value={formData.breed} onChange={handleChange} disabled={isLoading} /></div>
                  <div className={sharedStyles.formGroup}>
                    <label>Departamento:</label>
                    <select name="location.department" value={formData.location.department} onChange={handleChange} disabled={isLoading}>
                      <option value="">Selecciona un departamento</option>
                      {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                  </div>
                  <div className={sharedStyles.formGroup}>
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
                  <div className={sharedStyles.formGroup}><label>Fecha de Nacimiento:</label><input type="date" name="healthRecord.birthDate" value={formData.healthRecord.birthDate} onChange={handleChange} disabled={isLoading} /></div>
                  <div className={sharedStyles.formGroup}>
                    <label>Género:</label>
                    <select name="healthRecord.gender" value={formData.healthRecord.gender} onChange={handleChange} disabled={isLoading}>
                      <option value="">No especificado</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option>
                    </select>
                  </div>

                  <div className={styles.healthSection}>
                    <div className={styles.healthSectionHeader}>
                      <h4>Vacunas</h4>
                      {!showAddVaccine && <button type="button" className={styles.addRecordButton} onClick={() => setShowAddVaccine(true)}><Plus size={16} /> Añadir</button>}
                    </div>
                    {showAddVaccine && <AddVaccineForm onSave={handleAddVaccine} onCancel={() => setShowAddVaccine(false)} />}
                    <div className={styles.recordList}>
                      {formData.healthRecord.vaccines.length > 0 ? (
                        formData.healthRecord.vaccines.map(vaccine => (
                          <div key={vaccine.id} className={styles.recordCard}>
                            <div className={styles.recordCardInfo}>
                              <strong>{vaccine.name}</strong>
                              <span>Aplicada: {vaccine.date} {vaccine.nextDate && `| Próxima: ${vaccine.nextDate}`}</span>
                            </div>
                            <div className={styles.recordCardActions}>
                              <button type="button" onClick={() => handleRemoveVaccine(vaccine.id)}><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))
                      ) : (
                        !showAddVaccine && <div className={styles.emptyHealthSection}><p>Aún no has registrado ninguna vacuna.</p></div>
                      )}
                    </div>
                  </div>

                  <div className={styles.healthSection}>
                    <div className={styles.healthSectionHeader}>
                      <h4>Historial Clínico</h4>
                      {!showAddHistory && <button type="button" className={styles.addRecordButton} onClick={() => setShowAddHistory(true)}><Plus size={16} /> Añadir</button>}
                    </div>
                    {showAddHistory && <AddMedicalHistoryForm onSave={handleAddMedicalHistory} onCancel={() => setShowAddHistory(false)} />}
                    <div className={styles.recordList}>
                      {formData.healthRecord.medicalHistory.length > 0 ? (
                        formData.healthRecord.medicalHistory.map(entry => (
                          <div key={entry.id} className={styles.recordCard}>
                            <div className={styles.recordCardInfo}>
                              <strong>{entry.title}</strong>
                              <span>Fecha: {entry.date}</span>
                              {entry.description && <span style={{fontSize: '0.8rem', opacity: 0.8}}>{entry.description}</span>}
                            </div>
                            <div className={styles.recordCardActions}>
                              <button type="button" onClick={() => handleRemoveMedicalHistory(entry.id)}><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))
                      ) : (
                        !showAddHistory && <div className={styles.emptyHealthSection}><p>Aún no has registrado ninguna entrada en el historial.</p></div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={sharedStyles.modalFooter}>
              {message && <p className={message.startsWith('Error') ? sharedStyles.responseMessageError : sharedStyles.responseMessage}>{message}</p>}
              <button 
                type="submit" 
                className={`${sharedStyles.button} ${sharedStyles.primary}`} 
                style={{width:'100%'}} 
                disabled={isLoading || isUploading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default PetEditModal;