// frontend/src/ReportModal.jsx
// Versión: 1.2 - Robustez y Claridad Mejoradas
// MEJORA: Se ajusta el texto para que sea más claro y se manejan mejor los casos
// donde las props no se reciben, evitando comportamientos inesperados.

import React, { useState } from 'react';
import { auth } from './firebase';
import { X } from 'lucide-react';

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
    // [MEJORA] Verificación más robusta al inicio
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="report-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{step === 1 ? `Reportar ${contentTypeName}` : 'Reporte Enviado'}</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>
        
        {step === 1 ? (
          <>
            <div className="modal-body">
              {/* [MEJORA] Texto más claro y dinámico */}
              <p className="report-description">
                Ayúdanos a entender el problema. ¿Por qué estás reportando est{contentType === 'post' ? 'a' : 'e'} {contentTypeName} 
                {contentCreatorName ? ` de ` : ''}
                <strong>{contentCreatorName || ''}</strong>?
              </p>
              <div className="report-reasons-list">
                {REPORT_REASONS.map(reason => (
                  <button 
                    key={reason}
                    className={`reason-button ${selectedReason === reason ? 'selected' : ''}`}
                    onClick={() => setSelectedReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {error && <p className="response-message error">{error}</p>}
            </div>
            <div className="modal-footer">
              <button 
                className="submit-report-button" 
                onClick={handleSubmitReport}
                disabled={isLoading || !selectedReason}
              >
                {isLoading ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </>
        ) : (
          <div className="modal-body confirmation-view">
            <h3>¡Gracias por tu ayuda!</h3>
            <p>Hemos recibido tu reporte y nuestro equipo lo revisará pronto. Tu contribución es muy importante para mantener a EnlaPet como una comunidad segura y amigable.</p>
            <button className="submit-report-button" onClick={onClose}>Entendido</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
