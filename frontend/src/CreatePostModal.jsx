// frontend/src/CreatePostModal.jsx
// Versión: 2.3 - Devolución de Post Creado
// La función onPostCreated ahora pasa el objeto del post recién
// creado para una actualización instantánea de la UI.

import { useState, useRef } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Componente para el selector de autor ---
const AuthorSelector = ({ userProfile, pets, selectedAuthor, onSelectAuthor }) => {
  const userProfileWithId = { ...userProfile, id: auth.currentUser.uid };
  const allProfiles = [userProfileWithId, ...pets];

  return (
    <div className="author-selector-container">
      <div className="author-selector-scroll">
        {allProfiles.map(profile => {
          const isSelected = profile.id === selectedAuthor.id;
          const isUser = !profile.ownerId; 
          const profilePic = isUser ? profile.profilePictureUrl : profile.petPictureUrl;

          return (
            <div 
              key={profile.id} 
              className={`author-bubble ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectAuthor(profile)}
            >
              <div className="author-bubble-image">
                <img src={profilePic || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} alt={profile.name} />
              </div>
              <span className="author-bubble-name">{isUser ? 'Tú' : profile.name.split(' ')[0]}</span>
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
            // [REFINADO] Pasamos el objeto del post del backend a la función callback.
            onPostCreated(data.post); 
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            setMessage(error.message);
            onPostCreated(null); // Indicamos que no se pudo crear para que el feed se recargue
        } finally {
            setIsLoading(false);
        }
    };
    
    const placeholderText = selectedAuthor.ownerId
      ? `¿Qué está haciendo ${selectedAuthor.name}?`
      : `¿Qué estás pensando, ${selectedAuthor.name.split(' ')[0]}?`;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="create-post-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Crear un nuevo Momento</h2>
                    <button onClick={onClose} className="close-button" disabled={isLoading}>
                        <X size={24} />
                    </button>
                </div>
                
                <AuthorSelector 
                  userProfile={userProfile} 
                  pets={pets} 
                  selectedAuthor={selectedAuthor} 
                  onSelectAuthor={setSelectedAuthor}
                />

                <form onSubmit={handleSubmit} className="create-post-form">
                    <div className="modal-body" style={{paddingTop: '16px'}}>
                        <div 
                            className="image-upload-area" 
                            onClick={() => fileInputRef.current.click()}
                        >
                            {previewImage ? (
                                <img src={previewImage} alt="Previsualización" className="image-preview" />
                            ) : (
                                <div className="upload-prompt-content">
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
                        <div className="form-group">
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
                    <div className="modal-footer">
                        {message && <p className="response-message">{message}</p>}
                        <button type="submit" className="publish-button" disabled={isLoading}>
                            {isLoading ? 'Publicando...' : 'Publicar Momento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePostModal;
