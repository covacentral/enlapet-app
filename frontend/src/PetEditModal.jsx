// frontend/src/PetEditModal.jsx
// Versión: 3.9 - Corrige la aplicación de clases CSS para restaurar los estilos del modal.

import { useState, useEffect, useRef } from 'react';
import { colombiaDepartments } from './utils/colombiaData';
import { auth } from './firebase';
import { Plus, Trash2, Copy, Check } from 'lucide-react';

import styles from './PetEditModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Subcomponentes con estilos corregidos ---
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
      <div className={sharedStyles.formGroup}><label>Nombre de la Vacuna</label><input type="text" name="name" value={vaccine.name} onChange={handleChange} /></div>
      <div className={sharedStyles.formGroup}><label>Fecha de Aplicación</label><input type="date" name="date" value={vaccine.date} onChange={handleChange} /></div>
      <div className={sharedStyles.formGroup}><label>Próxima Dosis (Opcional)</label><input type="date" name="nextDate" value={vaccine.nextDate} onChange={handleChange} /></div>
      {/* --- CLASES CORREGIDAS --- */}
      <div className={styles.addRecordFormActions}>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={onCancel}>Cancelar</button>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
};

const AddMedicalHistoryForm = ({ onSave, onCancel }) => {
  const [history, setHistory] = useState({ title: '', date: '', description: '' });
  const handleChange = (e) => setHistory({ ...history, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (history.title && history.date && history.description) {
      onSave({ ...history, id: crypto.randomUUID() });
    }
  };

  return (
    <div className={styles.addRecordForm}>
      <div className={sharedStyles.formGroup}><label>Título del Registro</label><input type="text" name="title" value={history.title} onChange={handleChange} /></div>
      <div className={sharedStyles.formGroup}><label>Fecha</label><input type="date" name="date" value={history.date} onChange={handleChange} /></div>
      <div className={sharedStyles.formGroup}><label>Descripción</label><textarea name="description" value={history.description} onChange={handleChange}></textarea></div>
      {/* --- CLASES CORREGIDAS --- */}
      <div className={styles.addRecordFormActions}>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={onCancel}>Cancelar</button>
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
};


function PetEditModal({ pet, onClose, onPetUpdate }) {
  const [formData, setFormData] = useState({ ...pet });
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const departmentData = colombiaDepartments.find(d => d.department === formData.location.department);
    if (departmentData) {
      setCities(departmentData.cities.map(c => c.name));
    }
  }, [formData.location.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [field, subfield] = name.split('.');
    if (subfield) {
      setFormData(prev => ({ ...prev, [field]: { ...prev[field], [subfield]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    handleChange({ target: { name: 'location.department', value: department } });
    handleChange({ target: { name: 'location.city', value: '' } });
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setMessage('Subiendo foto...');
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado.');
        const idToken = await user.getIdToken();
        const uploadFormData = new FormData();
        uploadFormData.append('petPicture', file);

        const response = await fetch(`${API_URL}/api/pets/${pet.id}/picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
            body: uploadFormData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setFormData(prev => ({ ...prev, petPictureUrl: data.petPictureUrl }));
        setMessage('Foto actualizada con éxito.');
        onPetUpdate(); // Actualiza la UI en tiempo real
    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Guardando cambios...');
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado.');
        const idToken = await user.getIdToken();
        
        const response = await fetch(`${API_URL}/api/pets/${pet.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setMessage('Perfil actualizado con éxito.');
        onPetUpdate();
        setTimeout(() => onClose(), 1500);
    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddVaccine = (vaccine) => {
    setFormData(prev => ({...prev, healthRecord: { ...prev.healthRecord, vaccines: [...prev.healthRecord.vaccines, vaccine] }}));
    setShowAddVaccine(false);
  };
  const handleRemoveVaccine = (id) => setFormData(prev => ({ ...prev, healthRecord: { ...prev.healthRecord, vaccines: prev.healthRecord.vaccines.filter(v => v.id !== id)}}));

  const handleAddMedicalHistory = (history) => {
    setFormData(prev => ({ ...prev, healthRecord: { ...prev.healthRecord, medicalHistory: [...prev.healthRecord.medicalHistory, history] }}));
    setShowAddHistory(false);
  };
  const handleRemoveMedicalHistory = (id) => setFormData(prev => ({ ...prev, healthRecord: { ...prev.healthRecord, medicalHistory: prev.healthRecord.medicalHistory.filter(h => h.id !== id)}}));

  const copyEpid = () => {
      navigator.clipboard.writeText(formData.epid).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
      <div className={sharedStyles.modalBackdrop} onClick={onClose}>
        <div className={styles.content} onClick={e => e.stopPropagation()}>
          <div className={sharedStyles.modalHeader}>
            <h2>Editar Perfil de {formData.name}</h2>
            <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading || isUploading}>
              <X size={24} />
            </button>
          </div>
          
          {/* --- CLASES CORREGIDAS --- */}
          <div className={sharedStyles.modalTabs}>
            <button onClick={() => setActiveTab('info')} className={`${sharedStyles.modalTabButton} ${activeTab === 'info' ? sharedStyles.active : ''}`}>Información</button>
            <button onClick={() => setActiveTab('health')} className={`${sharedStyles.modalTabButton} ${activeTab === 'health' ? sharedStyles.active : ''}`}>Salud</button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* El div 'body' asegura el padding correcto para el contenido de las pestañas */}
            <div className={styles.body}>
              {activeTab === 'info' && (
                <>
                  <div className={styles.profilePictureSection}>
                    <img src={formData.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} alt={formData.name} className={styles.profilePicture} />
                    {/* --- CLASES CORREGIDAS --- */}
                    <button type="button" className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={() => fileInputRef.current.click()} disabled={isUploading}>
                      {isUploading ? 'Subiendo...' : 'Cambiar Foto'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display: 'none'}} accept="image/*" />
                  </div>
                  <div className={sharedStyles.formGroup}><label>Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} /></div>
                  <div className={sharedStyles.formGroup}><label>Raza</label><input type="text" name="breed" value={formData.breed} onChange={handleChange} /></div>
                  
                  <div className={sharedStyles.formGroup}>
                      <label>EnlaPet ID (EPID)</label>
                      <div className={styles.epidContainer}>
                          <div className={styles.epidDisplay}>
                            <input type="text" value={formData.epid} readOnly />
                            <button type="button" onClick={copyEpid} className={`${styles.copyButton} ${copied ? styles.copied : ''}`}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                      </div>
                  </div>

                  <div className={sharedStyles.formGroup}><label>Departamento</label><select name="location.department" value={formData.location.department} onChange={handleDepartmentChange}><option value="">Selecciona un departamento</option>{colombiaDepartments.map(d => <option key={d.id} value={d.department}>{d.department}</option>)}</select></div>
                  <div className={sharedStyles.formGroup}><label>Ciudad</label><select name="location.city" value={formData.location.city} onChange={handleChange} disabled={!formData.location.department}><option value="">Selecciona una ciudad</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select></div>
                </>
              )}
              {activeTab === 'health' && (
                <>
                  <div className={sharedStyles.formGroup}><label>Fecha de Nacimiento</label><input type="date" name="healthRecord.birthDate" value={formData.healthRecord.birthDate || ''} onChange={handleChange} /></div>
                  <div className={sharedStyles.formGroup}><label>Género</label><select name="healthRecord.gender" value={formData.healthRecord.gender || ''} onChange={handleChange}><option value="">No especificado</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option></select></div>
                  
                  <div className={styles.healthSection}><div className={styles.healthSectionHeader}><h4>Vacunas</h4>{!showAddVaccine && <button type="button" className={styles.addRecordButton} onClick={() => {setShowAddVaccine(true); setShowAddHistory(false);}}><Plus size={16}/> Añadir</button>}</div>{showAddVaccine && <AddVaccineForm onSave={handleAddVaccine} onCancel={() => setShowAddVaccine(false)} />}{formData.healthRecord.vaccines?.length > 0 ? (<div className={styles.recordList}>{formData.healthRecord.vaccines.map(v => <div key={v.id} className={styles.recordCard}><div className={styles.recordCardInfo}><strong>{v.name}</strong><span>Fecha: {v.date}</span></div><div className={styles.recordCardActions}><button type="button" onClick={() => handleRemoveVaccine(v.id)}><Trash2 size={16}/></button></div></div>)}</div>) : (<div className={styles.emptyHealthSection}><p>Sin vacunas registradas.</p></div>)}</div>
                  <div className={styles.healthSection}><div className={styles.healthSectionHeader}><h4>Historial Clínico</h4>{!showAddHistory && <button type="button" className={styles.addRecordButton} onClick={() => {setShowAddHistory(true); setShowAddVaccine(false)}}><Plus size={16}/> Añadir</button>}</div>{showAddHistory && <AddMedicalHistoryForm onSave={handleAddMedicalHistory} onCancel={() => setShowAddHistory(false)} />}{formData.healthRecord.medicalHistory?.length > 0 ? (<div className={styles.recordList}>{formData.healthRecord.medicalHistory.map(h => <div key={h.id} className={styles.recordCard}><div className={styles.recordCardInfo}><strong>{h.title}</strong><span>Fecha: {h.date}</span></div><div className={styles.recordCardActions}><button type="button" onClick={() => handleRemoveMedicalHistory(h.id)}><Trash2 size={16}/></button></div></div>)}</div>) : (<div className={styles.emptyHealthSection}><p>Sin historial clínico.</p></div>)}</div>
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