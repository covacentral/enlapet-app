// frontend/src/components/SOAPForm.jsx
// (NUEVO) Componente de formulario dedicado para el registro de consultas SOAP.

import { useState } from 'react';
import styles from './SOAPForm.module.css';
import sharedStyles from '../shared.module.css';

function SOAPForm({ pet, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        subjective: '',
        objective: {
            weightKg: '',
            temperatureC: '',
            heartRateBpm: '',
            respiratoryRateRpm: '',
        },
        appreciation: '',
        plan: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleObjectiveChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            objective: {
                ...prev.objective,
                [name]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // La prop onSave se encargará de hacer la llamada a la API
        await onSave({ recordType: 'consultations', data: formData });
        setIsLoading(false);
    };

    return (
        <div className={styles.formContainer}>
            <h3 className={styles.formTitle}>Nueva Consulta para {pet.name}</h3>
            <form onSubmit={handleSubmit}>
                <div className={sharedStyles.formGroup}>
                    <label htmlFor="date">Fecha de la Consulta</label>
                    <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
                </div>

                <div className={sharedStyles.formGroup}>
                    <label htmlFor="subjective">S (Subjetivo): Reporte del Dueño</label>
                    <textarea id="subjective" name="subjective" rows="3" value={formData.subjective} onChange={handleChange} required></textarea>
                </div>

                <fieldset className={styles.fieldset}>
                    <legend>O (Objetivo): Constantes Vitales</legend>
                    <div className={styles.formRow}>
                        <div className={sharedStyles.formGroup}>
                            <label htmlFor="weightKg">Peso (kg)</label>
                            <input type="number" step="0.1" id="weightKg" name="weightKg" value={formData.objective.weightKg} onChange={handleObjectiveChange} />
                        </div>
                        <div className={sharedStyles.formGroup}>
                            <label htmlFor="temperatureC">Temp (°C)</label>
                            <input type="number" step="0.1" id="temperatureC" name="temperatureC" value={formData.objective.temperatureC} onChange={handleObjectiveChange} />
                        </div>
                        <div className={sharedStyles.formGroup}>
                            <label htmlFor="heartRateBpm">FC (lpm)</label>
                            <input type="number" id="heartRateBpm" name="heartRateBpm" value={formData.objective.heartRateBpm} onChange={handleObjectiveChange} />
                        </div>
                         <div className={sharedStyles.formGroup}>
                            <label htmlFor="respiratoryRateRpm">FR (rpm)</label>
                            <input type="number" id="respiratoryRateRpm" name="respiratoryRateRpm" value={formData.objective.respiratoryRateRpm} onChange={handleObjectiveChange} />
                        </div>
                    </div>
                </fieldset>

                <div className={sharedStyles.formGroup}>
                    <label htmlFor="appreciation">A (Apreciación): Diagnóstico</label>
                    <textarea id="appreciation" name="appreciation" rows="3" value={formData.appreciation} onChange={handleChange} required></textarea>
                </div>

                <div className={sharedStyles.formGroup}>
                    <label htmlFor="plan">P (Plan): Tratamiento y Recomendaciones</label>
                    <textarea id="plan" name="plan" rows="4" value={formData.plan} onChange={handleChange} required></textarea>
                </div>

                <div className={styles.actions}>
                    <button type="button" onClick={onCancel} className={`${sharedStyles.button} ${sharedStyles.secondary}`} disabled={isLoading}>Cancelar</button>
                    <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} disabled={isLoading}>
                        {isLoading ? 'Guardando...' : 'Guardar Consulta'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SOAPForm;