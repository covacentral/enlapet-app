// frontend/src/SettingsTab.jsx
// Versión: 2.9 - CORRECCIÓN LÓGICA FINAL
// TAREA: Se corrige el subcomponente VerificationStatus para que se muestre correctamente en usuarios sin historial de verificación.

import { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { signOut } from "firebase/auth";
import { ShieldCheck, Clock, ShieldX } from 'lucide-react';

import VerificationModal from './VerificationModal';
import styles from './SettingsTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- SUBCOMPONENTES (CON LÍNEA CORREGIDA) ---
const VerificationStatus = ({ verification, onOpenModal }) => {
  // --- LÍNEA CORREGIDA ---
  // Antes: if (!verification) return null;
  // Ahora: Asignamos un valor por defecto si 'verification' no existe. Esto asegura que el componente SIEMPRE se renderice.
  const verif = verification || { status: 'none', type: 'none' };
  const { status, type, rejectionReason } = verif;

  switch (status) {
    case 'verified':
      return (
        <div className={`${styles.statusBox} ${styles.verified}`}>
          <ShieldCheck size={20} />
          <div><strong>Cuenta Verificada</strong><span>Tipo: {type.charAt(0).toUpperCase() + type.slice(1)}</span></div>
        </div>
      );
    case 'pending':
      return (
        <div className={`${styles.statusBox} ${styles.pending}`}>
          <Clock size={20} />
          <div><strong>Solicitud Pendiente</strong><span>Tu solicitud está siendo revisada por nuestro equipo.</span></div>
        </div>
      );
    case 'rejected':
      return (
        <div className={`${styles.statusBox} ${styles.rejected}`}>
          <ShieldX size={20} />
          <div><strong>Solicitud Rechazada</strong><span>{rejectionReason || 'No se cumplieron los requisitos.'}</span><button className={sharedStyles.linkButton} onClick={onOpenModal}>Reintentar solicitud</button></div>
        </div>
      );
    default: // 'none'
      return (
        <div className={styles.statusBox}>
          <div><strong>Tu cuenta no está verificada.</strong><span>Verifica tu perfil para acceder a herramientas profesionales y generar más confianza.</span><button className={`${sharedStyles.button} ${sharedStyles.secondary}`} style={{marginTop: '10px'}} onClick={onOpenModal}>Solicitar Verificación</button></div>
        </div>
      );
  }
};

// --- COMPONENTE PRINCIPAL (SIN CAMBIOS) ---
function SettingsTab({ user, userProfile, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', bio: '' });
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const populateFields = () => {
    if (userProfile) {
      setFormData({ name: userProfile.name || '', phone: userProfile.phone || '', bio: userProfile.bio || '' });
    }
  };

  useEffect(() => {
    if (!isEditMode) populateFields();
  }, [userProfile, isEditMode]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      try { await signOut(auth); } catch (error) { setMessage({ text: 'Error al cerrar sesión.', isError: true }); }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage({ text: 'Guardando cambios...', isError: false });
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage({ text: 'Perfil guardado con éxito.', isError: false });
      onProfileUpdate();
      setIsEditMode(false);
    } catch (error) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setMessage({ text: 'Subiendo foto...', isError: false });
    const formPayload = new FormData();
    formPayload.append('profilePicture', file);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/profile/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formPayload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage({ text: '¡Foto de perfil actualizada!', isError: false });
      onProfileUpdate();
    } catch (error) {
      setMessage({ text: error.message || "Error al subir la foto.", isError: true });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setMessage({ text: '', isError: false });
  };

  return (
    <>
      {isVerificationModalOpen && (
        <VerificationModal onClose={() => setIsVerificationModalOpen(false)} onVerificationRequested={onProfileUpdate} />
      )}

      <div className={styles.container}>
        <div className={sharedStyles.modalHeader}>
            <h2>Ajustes de la Cuenta</h2>
        </div>
        
        <div className={sharedStyles.modalTabs}>
            <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'profile' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('profile')}>
                Perfil Público
            </button>
            <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'verification' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('verification')}>
                Verificación de Cuenta
            </button>
        </div>

        {message.text && (
          <p className={message.isError ? sharedStyles.responseMessageError : sharedStyles.responseMessageSuccess} style={{textAlign: 'center', marginTop: '1rem'}}>
            {message.text}
          </p>
        )}

        {activeTab === 'verification' && (
          <div className={styles.section}>
            <VerificationStatus verification={userProfile?.verification} onOpenModal={() => setIsVerificationModalOpen(true)} />
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className={styles.section}>
            <div className={styles.header} style={{paddingBottom: 0, borderBottom: 'none', marginBottom: 0}}>
              <h3>Tu Información</h3>
              {!isEditMode && (<button onClick={() => setIsEditMode(true)} className={`${sharedStyles.button} ${sharedStyles.primary}`}>Editar Perfil</button>)}
            </div>
            {isEditMode ? (
              <form onSubmit={handleUpdateProfile}>
                <div className={sharedStyles.formGroup}><label htmlFor="name">Nombre:</label><input type="text" id="name" value={formData.name} onChange={handleChange} required /></div>
                <div className={sharedStyles.formGroup}><label htmlFor="phone">Teléfono de Contacto:</label><input type="tel" id="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: 573001234567" /></div>
                <div className={sharedStyles.formGroup}><label htmlFor="bio">Biografía (máx. 70 caracteres):</label><textarea id="bio" value={formData.bio} onChange={handleChange} rows="3" maxLength="70"></textarea><small className={styles.charCounter}>{formData.bio.length} / 70</small></div>
                <div className={styles.formActions}><button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} disabled={isUpdating}>{isUpdating ? 'Guardando...' : 'Guardar Cambios'}</button><button type="button" className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={handleCancelEdit} disabled={isUpdating}>Cancelar</button></div>
              </form>
            ) : (
              <div className={styles.displayProfile}>
                <div className={styles.infoItem}><strong>Nombre:</strong><p>{userProfile?.name || 'No establecido'}</p></div>
                <div className={styles.infoItem}><strong>Teléfono:</strong><p>{userProfile?.phone || 'No establecido'}</p></div>
                <div className={styles.infoItem}><strong>Biografía:</strong><p>{userProfile?.bio || 'Sin biografía.'}</p></div>
                <div className={styles.pictureSection}><p>Tu foto de perfil actual se muestra en la cabecera principal.</p><button onClick={() => fileInputRef.current.click()} className={`${sharedStyles.button} ${sharedStyles.secondary}`} disabled={isUploading}>{isUploading ? 'Subiendo...' : 'Cambiar Foto de Perfil'}</button><input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" /></div>
              </div>
            )}
          </div>
        )}

        <div className={styles.logoutSection}>
          <button onClick={handleLogout} className={`${sharedStyles.button} ${sharedStyles.danger}`}>Cerrar Sesión</button>
        </div>
      </div>
    </>
  );
}

export default SettingsTab;