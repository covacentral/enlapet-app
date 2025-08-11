// frontend/src/PatientDetailModal.jsx
// Versión 1.1: Añade renderizado condicional para prevenir error en la carga.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import { X, Plus } from 'lucide-react';
import LoadingComponent from './LoadingComponent';

import styles from './PatientDetailModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Formularios (temporalmente definidos aquí) ---
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
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSave}>Guardar Registro</button>
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
        <button type="button" className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSave}>Guardar Registro</button>
      </div>
    </div>
  );
};


// --- Componente Principal del Modal ---
function PatientDetailModal({ petSummary, onClose, onUpdate }) {
  const [petDetails, setPetDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);

  const fetchPatientDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/vet/patient/${petSummary.id}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error((await response.json()).message);
      
      const data = await response.json();
      setPetDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [petSummary.id]);

  useEffect(() => {
    fetchPatientDetails();
  }, [fetchPatientDetails]);
  
  const handleAddRecord = async (type, record) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado.");
        const idToken = await user.getIdToken();

        await fetch(`${API_URL}/api/vet/patient/${petSummary.id}/health-record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
            body: JSON.stringify({ type, record })
        });

        fetchPatientDetails();
        setShowAddVaccine(false);
        setShowAddHistory(false);
        onUpdate();
      } catch (err) {
          setError(err.message);
      }
  };

  return (
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h2>Historial Clínico</h2>
          <button onClick={onClose} className={sharedStyles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {isLoading && <LoadingComponent text="Cargando datos del paciente..." />}
        {error && <p className={sharedStyles.responseMessageError} style={{padding: '1rem'}}>{error}</p>}

        {/* --- LÍNEA CORREGIDA --- */}
        {/* Solo intentamos renderizar los detalles si petDetails NO es null */}
        {petDetails && (
          <>
            <div className={styles.headerInfo}>
              <img src={petDetails.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={petDetails.name} className={styles.petImage} />
              <div className={styles.petDetails}>
                <h3>{petDetails.name}</h3>
                <p>{petDetails.breed}</p>
                {/* Aseguramos que ownerInfo exista antes de leer 'name' */}
                <p><strong>Responsable:</strong> {petDetails.ownerInfo?.name || 'No disponible'}</p>
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.healthSection}>
                <div className={styles.healthSectionHeader}>
                  <h4>Vacunas</h4>
                  {!showAddVaccine && <button type="button" className={styles.addRecordButton} onClick={() => {setShowAddVaccine(true); setShowAddHistory(false);}}><Plus size={16}/>Añadir</button>}
                </div>
                {showAddVaccine && <AddVaccineForm onSave={(record) => handleAddRecord('vaccine', record)} onCancel={() => setShowAddVaccine(false)}/>}
                <div className={styles.recordList}>
                  {petDetails.healthRecord?.vaccines?.length > 0 ? (
                    petDetails.healthRecord.vaccines.map(v => <div key={v.id} className={styles.recordCard}><strong>{v.name}</strong><span>Aplicada: {v.date}</span></div>)
                  ) : <div className={styles.emptyHealthSection}><p>Sin vacunas registradas.</p></div>}
                </div>
              </div>

              <div className={styles.healthSection}>
                <div className={styles.healthSectionHeader}>
                  <h4>Historial Clínico</h4>
                  {!showAddHistory && <button type="button" className={styles.addRecordButton} onClick={() => {setShowAddHistory(true); setShowAddVaccine(false);}}><Plus size={16}/>Añadir</button>}
                </div>
                {showAddHistory && <AddMedicalHistoryForm onSave={(record) => handleAddRecord('medicalHistory', record)} onCancel={() => setShowAddHistory(false)}/>}
                <div className={styles.recordList}>
                  {petDetails.healthRecord?.medicalHistory?.length > 0 ? (
                    petDetails.healthRecord.medicalHistory.map(h => <div key={h.id} className={styles.recordCard}><strong>{h.title}</strong><span>Fecha: {h.date}</span></div>)
                  ) : <div className={styles.emptyHealthSection}><p>Sin historial clínico registrado.</p></div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PatientDetailModal;