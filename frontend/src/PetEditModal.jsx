// frontend/src/PetEditModal.jsx
// Versión: 3.7 - Restaura los campos de ubicación en el formulario.
// TAREA: Se reintroducen los selectores de Departamento y Ciudad para permitir completar el perfil.

import { useState, useEffect, useRef } from 'react';
import { colombiaData, departments } from './utils/colombiaData';
import { auth } from './firebase';
import { Plus, Trash2, Copy, Check } from 'lucide-react';

import styles from './PetEditModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Subcomponentes (sin cambios) ---
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
      <div className={sharedStyles.formGroup}><label>Nombre de la Vacuna</label><input type="text" name="name" value={vaccine.name} onChange={handleChange} required /></div>
      <div className={sharedStyles.formRow}>
        <div className={sharedStyles.formGroup}><label>Fecha de Aplicación</label><input type="date" name="date" value={vaccine.date} onChange={handleChange} required /></div>
        <div className={sharedStyles.formGroup}><label>Próximo Refuerzo (Opcional)</label><input type="date" name="nextDate" value={vaccine.nextDate} onChange={handleChange} /></div>
      </div>
      <div className={styles.addRecordFormActions}>
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
      <div className={sharedStyles.formGroup}><label>Motivo o Título</label><input type="text" name="title" value={entry.title} onChange={handleChange} required /></div>
      <div className={sharedStyles.formGroup}><label>Fecha</label><input type="date" name="date" value={entry.date} onChange={handleChange} required /></div>
      <div className={sharedStyles.formGroup}><label>Descripción (Opcional)</label><textarea name="description" rows="3" value={entry.description} onChange={handleChange}></textarea></div>
      <div className={styles.addRecordFormActions}>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={onCancel}>Cancelar</button>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
};


function PetEditModal({ pet, user, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState(null);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef(null);

  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);

  useEffect(() => {
    if (pet) {
      const defaultHealthRecord = { birthDate: '', gender: '', vaccines: [], medicalHistory: [] };
      const defaultLocation = { department: '', city: '' };

      setFormData({
        name: pet.name || '',
        breed: pet.breed || '',
        epid: pet.epid || 'GENERANDO...',
        location: pet.location || defaultLocation,
        healthRecord: pet.healthRecord || defaultHealthRecord,
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
        setCities(departmentData ? departmentData.ciudades.sort() : []);
      }
      setFormData(prev => ({ ...prev, [section]: newSectionData }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddVaccine = (vaccine) => {
    const updatedVaccines = [...formData.healthRecord.vaccines, vaccine];
    setFormData(prev => ({ ...prev, healthRecord: { ...prev.healthRecord, vaccines: updatedVaccines } }));
    setShowAddVaccine(false);
  };
  const handleRemoveVaccine = (vaccineId) => {
    const updatedVaccines = formData.healthRecord.vaccines.filter(v => v.id !== vaccineId);
    setFormData(prev => ({ ...prev, healthRecord: { ...prev.healthRecord, vaccines: updatedVaccines } }));
  };
  const handleAddMedicalHistory = (entry) => {
    const updatedHistory = [...formData.healthRecord.medicalHistory, entry];
    setFormData(prev => ({ ...prev, healthRecord: { ...prev.healthRecord, medicalHistory: updatedHistory } }));
    setShowAddHistory(false);
  };
  const handleRemoveMedicalHistory = (entryId) => {
    const updatedHistory = formData.healthRecord.medicalHistory.filter(h => h.id !== entryId);
    setFormData(prev => ({ ...prev, healthRecord: { ...prev.healthRecord, medicalHistory: updatedHistory } }));
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
  
  const handleCopyEpid = () => {
    navigator.clipboard.writeText(formData.epid).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!formData) return null;

  return (
      <div className={sharedStyles.modalBackdrop} onClick={onClose}>
        <div className={styles.content} onClick={e => e.stopPropagation()}>
          <div className={sharedStyles.modalHeader} style={{borderBottom: 'none'}}>
            <h2>Editar Perfil de {formData.name}</h2>
            <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading || isUploading}>X</button>
          </div>
          
          <form onSubmit={handleSaveChanges}>
            <div className={sharedStyles.modalTabs} style={{padding: '0 24px'}}>
              <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'profile' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('profile')}>Perfil</button>
              <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'health' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('health')}>Carné de Salud</button>
            </div>

            <div className={styles.body}>
              {activeTab === 'profile' && (
                <>
                  <div className={styles.epidContainer}>
                      <label>EnlaPet ID (EPID)</label>
                      <div className={styles.epidDisplay}>
                          <input type="text" value={formData.epid} readOnly />
                          <button type="button" onClick={handleCopyEpid} className={`${styles.copyButton} ${isCopied ? styles.copied : ''}`}>
                              {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                      </div>
                  </div>

                  <div className={sharedStyles.formGroup}><label>Nombre:</label><input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} /></div>
                  <div className={sharedStyles.formGroup}><label>Raza:</label><input type="text" name="breed" value={formData.breed} onChange={handleChange} disabled={isLoading} /></div>
                  
                  {/* --- CAMPOS DE UBICACIÓN RESTAURADOS --- */}
                  <div className={sharedStyles.formRow}>
                    <div className={sharedStyles.formGroup}>
                      <label>Departamento:</label>
                      <select name="location.department" value={formData.location.department} onChange={handleChange} disabled={isLoading}>
                        <option value="">Selecciona...</option>
                        {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                      </select>
                    </div>
                    <div className={sharedStyles.formGroup}>
                      <label>Ciudad:</label>
                      <select name="location.city" value={formData.location.city} onChange={handleChange} disabled={!formData.location.department || isLoading}>
                        <option value="">Selecciona...</option>
                        {cities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* --- FIN DE CAMPOS RESTAURADOS --- */}

                  <div className={sharedStyles.formGroup}><label>Foto de Perfil:</label><button type="button" onClick={() => fileInputRef.current.click()} className={`${sharedStyles.button} ${sharedStyles.secondary}`} disabled={isUploading}>{isUploading ? 'Subiendo...' : 'Cambiar Foto'}</button><input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" /></div>
                </>
              )}

              {activeTab === 'health' && (
                <>
                  <div className={sharedStyles.formGroup}><label>Fecha de Nacimiento:</label><input type="date" name="healthRecord.birthDate" value={formData.healthRecord.birthDate} onChange={handleChange} disabled={isLoading} /></div>
                  <div className={sharedStyles.formGroup}><label>Género:</label><select name="healthRecord.gender" value={formData.healthRecord.gender} onChange={handleChange} disabled={isLoading}><option value="">No especificado</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option></select></div>
                  <div className={styles.healthSection}><div className={styles.healthSectionHeader}><h4>Vacunas</h4>{!showAddVaccine && <button type="button" className={styles.addRecordButton} onClick={() => {setShowAddVaccine(true); setShowAddHistory(false);}}><Plus size={16}/> Añadir</button>}</div>{showAddVaccine && <AddVaccineForm onSave={handleAddVaccine} onCancel={() => setShowAddVaccine(false)} />}{formData.healthRecord.vaccines?.length > 0 ? (<div className={styles.recordList}>{formData.healthRecord.vaccines.map(v => <div key={v.id} className={styles.recordCard}><div className={styles.recordCardInfo}><strong>{v.name}</strong><span>Aplicada: {v.date}</span></div><div className={styles.recordCardActions}><button onClick={() => handleRemoveVaccine(v.id)}><Trash2 size={16}/></button></div></div>)}</div>) : (<div className={styles.emptyHealthSection}><p>Sin vacunas registradas.</p></div>)}</div>
                  <div className={styles.healthSection}><div className={styles.healthSectionHeader}><h4>Historial Clínico</h4>{!showAddHistory && <button type="button" className={styles.addRecordButton} onClick={() => {setShowAddHistory(true); setShowAddVaccine(false)}}><Plus size={16}/> Añadir</button>}</div>{showAddHistory && <AddMedicalHistoryForm onSave={handleAddMedicalHistory} onCancel={() => setShowAddHistory(false)} />}{formData.healthRecord.medicalHistory?.length > 0 ? (<div className={styles.recordList}>{formData.healthRecord.medicalHistory.map(h => <div key={h.id} className={styles.recordCard}><div className={styles.recordCardInfo}><strong>{h.title}</strong><span>Fecha: {h.date}</span></div><div className={styles.recordCardActions}><button onClick={() => handleRemoveMedicalHistory(h.id)}><Trash2 size={16}/></button></div></div>)}</div>) : (<div className={styles.emptyHealthSection}><p>Sin historial clínico.</p></div>)}</div>
                </>
              )}
            </div>

            <div className={sharedStyles.modalFooter}>
              {message && <p className={message.startsWith('Error') ? sharedStyles.responseMessageError : sharedStyles.responseMessage}>{message}</p>}
              <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width:'100%'}} disabled={isLoading || isUploading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default PetEditModal;