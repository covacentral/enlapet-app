// frontend/src/CreatePostModal.jsx
// Versión: 1.1 - Previsualización de Imagen Corregida
// Utiliza nuevas clases de CSS para contener la imagen de previsualización.

import { useState, useRef } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function CreatePostModal({ petProfile, onClose, onPostCreated }) {
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

        const formData = new FormData();
        formData.append('postImage', postImage);
        formData.append('caption', caption);
        formData.append('authorId', petProfile.id);
        formData.append('authorType', 'pet');

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
            onPostCreated(); 
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="create-post-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Crear un nuevo Momento</h2>
                    <button onClick={onClose} className="close-button" disabled={isLoading}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="create-post-form">
                    <div className="modal-body">
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
                                placeholder={`¿Qué está haciendo ${petProfile.name}?`}
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
