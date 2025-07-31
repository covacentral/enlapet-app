// frontend/src/ReportModal.jsx
// Versión: 1.3 - Refactorización a CSS Modules
// TAREA: Se implementan los módulos de estilos local y compartido.

import React, { useState } from 'react';
import { auth } from './firebase';
import { X } from 'lucide-react';

// 1. IMPORTAMOS los nuevos módulos de CSS
import styles from './ReportModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const REPORT_REASONS = [
  "Spam o publicidad",
  "Contenido inapropiado o sensible",
  "Acoso o discurso de odio",
  "Información falsa",
  "Otro motivo"
];

function ReportModal({ contentId, contentType, contentCreatorName, onClose }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitReport = async () => {
    if (!selectedReason || !contentId || !contentType) {
      setError('Error: No se pudo identificar el contenido a reportar. Inténtalo de nuevo.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();

      const payload = {
        contentId: contentId,
        contentType: contentType,
        reason: selectedReason,
      };

      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || 'No se pudo enviar el reporte.');
      }
      
      setStep(2);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const contentTypeName = contentType === 'post' ? 'publicación' : 'evento';

  return (
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h2>{step === 1 ? `Reportar ${contentTypeName}` : 'Reporte Enviado'}</h2>
          <button onClick={onClose} className={sharedStyles.closeButton}>
            <X size={24} />
          </button>
        </div>
        
        {step === 1 ? (
          <>
            <div className={styles.body}>
              <p className={styles.description}>
                Ayúdanos a entender el problema. ¿Por qué estás reportando est{contentType === 'post' ? 'a' : 'e'} {contentTypeName} 
                {contentCreatorName ? ` de ` : ''}
                <strong>{contentCreatorName || ''}</strong>?
              </p>
              <div className={styles.reasonsList}>
                {REPORT_REASONS.map(reason => (
                  <button 
                    key={reason}
                    className={`${styles.reasonButton} ${selectedReason === reason ? styles.selected : ''}`}
                    onClick={() => setSelectedReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {error && <p className={sharedStyles.responseMessageError}>{error}</p>}
            </div>
            <div className={sharedStyles.modalFooter}>
              <button 
                className={`${sharedStyles.button} ${sharedStyles.primary}`} 
                onClick={handleSubmitReport}
                disabled={isLoading || !selectedReason}
                style={{width: '100%'}}
              >
                {isLoading ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.confirmationView}>
            <h3>¡Gracias por tu ayuda!</h3>
            <p>Hemos recibido tu reporte y nuestro equipo lo revisará pronto. Tu contribución es muy importante para mantener a EnlaPet como una comunidad segura y amigable.</p>
            <button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={onClose}>Entendido</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportModal;