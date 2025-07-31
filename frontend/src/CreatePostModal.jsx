// frontend/src/CreatePostModal.jsx
// Versión: 2.5 - Corrección de Estilos de Botón
// TAREA: Se aplican las clases correctas del sistema de botones compartidos.

import { useState, useRef } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { auth } from './firebase';

import styles from './CreatePostModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AuthorSelector = ({ userProfile, pets, selectedAuthor, onSelectAuthor }) => {
  const userProfileWithId = { ...userProfile, id: auth.currentUser.uid };
  const allProfiles = [userProfileWithId, ...pets];

  return (
    <div className={styles.authorSelectorContainer}>
      <div className={styles.authorSelectorScroll}>
        {allProfiles.map(profile => {
          const isSelected = profile.id === selectedAuthor.id;
          const isUser = !profile.ownerId; 
          const profilePic = isUser ? profile.profilePictureUrl : profile.petPictureUrl;

          return (
            <div 
              key={profile.id} 
              className={`${styles.authorBubble} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectAuthor(profile)}
            >
              <div className={styles.authorBubbleImage}>
                <img src={profilePic || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} alt={profile.name} />
              </div>
              <span className={styles.authorBubbleName}>{isUser ? 'Tú' : profile.name.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function CreatePostModal({ userProfile, pets, initialAuthor, onClose, onPostCreated }) {
    const userProfileWithId = { ...userProfile, id: auth.currentUser.uid };
    const [selectedAuthor, setSelectedAuthor] = useState(initialAuthor || userProfileWithId);
    const [caption, setCaption] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPostImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!postImage || !caption) {
            setMessage('Por favor, añade una imagen y un texto.');
            return;
        }
        setIsLoading(true);
        setMessage('Publicando momento...');

        const authorType = selectedAuthor.ownerId ? 'pet' : 'user';
        const formData = new FormData();
        formData.append('postImage', postImage);
        formData.append('caption', caption);
        formData.append('authorId', selectedAuthor.id);
        formData.append('authorType', authorType);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No autenticado");
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/posts`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al crear la publicación.');
            }

            setMessage('¡Momento publicado con éxito!');
            onPostCreated(data.post); 
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            setMessage(error.message);
            onPostCreated(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const placeholderText = selectedAuthor.ownerId
      ? `¿Qué está haciendo ${selectedAuthor.name}?`
      : `¿Qué estás pensando, ${selectedAuthor.name.split(' ')[0]}?`;

    return (
        <div className={sharedStyles.modalBackdrop} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <div className={sharedStyles.modalHeader}>
                    <h2>Crear un nuevo Momento</h2>
                    <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}>
                        <X size={24} />
                    </button>
                </div>
                
                <AuthorSelector 
                  userProfile={userProfile} 
                  pets={pets} 
                  selectedAuthor={selectedAuthor} 
                  onSelectAuthor={setSelectedAuthor}
                />

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.body}>
                        <div 
                            className={styles.imageUploadArea} 
                            onClick={() => fileInputRef.current.click()}
                        >
                            {previewImage ? (
                                <img src={previewImage} alt="Previsualización" className={styles.imagePreview} />
                            ) : (
                                <div className={styles.uploadPromptContent}>
                                    <UploadCloud size={48} />
                                    <p>Haz clic aquí para seleccionar una foto</p>
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            style={{ display: 'none' }} 
                        />
                        <div className={sharedStyles.formGroup}>
                            <textarea
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder={placeholderText}
                                rows="4"
                                maxLength="280"
                                required
                                disabled={isLoading}
                            ></textarea>
                        </div>
                    </div>
                    <div className={sharedStyles.modalFooter}>
                        {message && <p className={sharedStyles.responseMessage}>{message}</p>}
                        {/* --- LÍNEA CORREGIDA --- */}
                        <button 
                          type="submit" 
                          className={`${sharedStyles.button} ${sharedStyles.primary}`} 
                          style={{width: '100%'}} 
                          disabled={isLoading}
                        >
                            {isLoading ? 'Publicando...' : 'Publicar Momento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePostModal;