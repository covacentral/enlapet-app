// frontend/src/VerificationModal.jsx
// Componente para que los usuarios soliciten la verificación de su cuenta.

import { useState, useRef } from 'react';
import { auth } from './firebase';
import { X, UploadCloud, FileText, Trash2 } from 'lucide-react';

import styles from './VerificationModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Opciones de perfiles a verificar. Coinciden con el backend.
const VERIFICATION_TYPES = [
  { value: 'vet', label: 'Veterinaria o Profesional de la Salud Animal' },
  { value: 'shop', label: 'Tienda de Mascotas (Pet Shop)' },
  { value: 'foundation', label: 'Fundación o Refugio' },
  { value: 'government', label: 'Entidad Gubernamental' }
];

function VerificationModal({ onClose, onVerificationRequested }) {
  const [verificationType, setVerificationType] = useState('vet');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 5) {
      setMessage('Error: No puedes subir más de 5 documentos.');
      return;
    }
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (fileName) => {
    setFiles(prevFiles => prevFiles.filter(f => f.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setMessage('Error: Debes adjuntar al menos un documento de soporte.');
      return;
    }
    setIsLoading(true);
    setMessage('Enviando solicitud...');

    const formData = new FormData();
    formData.append('verificationType', verificationType);
    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/verification/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al enviar la solicitud.');
      
      setMessage('¡Solicitud enviada con éxito! La revisaremos y te notificaremos.');
      onVerificationRequested(); // Llama a la función para actualizar la UI anterior
      setTimeout(() => onClose(), 2500);

    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h2>Solicitar Verificación</h2>
          <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.description}>
            La verificación nos ayuda a confirmar la autenticidad de perfiles profesionales y organizaciones. 
            Esto construye una comunidad más segura y confiable para todos.
          </p>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="verificationType">¿Qué tipo de cuenta quieres verificar?</label>
            <select
              id="verificationType"
              value={verificationType}
              onChange={(e) => setVerificationType(e.target.value)}
              disabled={isLoading}
            >
              {VERIFICATION_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className={sharedStyles.formGroup}>
            <label>Documentos de Soporte</label>
            <div className={styles.fileUploadArea} onClick={() => fileInputRef.current.click()}>
              <div className={styles.uploadPrompt}>
                <UploadCloud size={48} />
                <span>Haz clic para seleccionar tus archivos</span>
                <small>(Máx. 5 archivos, 5MB cada uno)</small>
              </div>
            </div>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,application/pdf"
            />
          </div>

          {files.length > 0 && (
            <div className={styles.fileList}>
              <h4>Archivos seleccionados:</h4>
              {files.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <FileText size={16} />
                  <span>{file.name}</span>
                  <button type="button" onClick={() => handleRemoveFile(file.name)} className={styles.removeFileButton} disabled={isLoading}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className={sharedStyles.modalFooter}>
            {message && <p className={message.startsWith('Error') ? sharedStyles.responseMessageError : sharedStyles.responseMessage}>{message}</p>}
            <button
              type="submit"
              className={`${sharedStyles.button} ${sharedStyles.primary}`}
              style={{ width: '100%' }}
              disabled={isLoading || files.length === 0}
            >
              {isLoading ? 'Enviando...' : 'Enviar Solicitud de Verificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerificationModal;