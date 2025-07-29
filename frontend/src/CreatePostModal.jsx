import React, { useState, useEffect } from 'react';
import useAuth from './hooks/useAuth';
import api from './services/api';
import { X } from 'lucide-react';

const CreatePostModal = ({ onClose }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pets, setPets] = useState([]);
  const [authorProfile, setAuthorProfile] = useState(null); // Perfil seleccionado para publicar
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Al abrir el modal, cargamos las mascotas del usuario para el selector
  useEffect(() => {
    const fetchUserPets = async () => {
      try {
        const response = await api.get('/pets');
        setPets(response.data);
        // Por defecto, el autor es el propio usuario
        setAuthorProfile({ id: user.uid, name: user.name, type: 'user' });
      } catch (err) {
        console.error("Error al cargar las mascotas del usuario:", err);
      }
    };
    fetchUserPets();
  }, [user]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text || !authorProfile) {
      setError('El texto y el autor son requeridos.');
      return;
    }
    setIsLoading(true);
    setError('');

    // FormData es la forma estándar de enviar archivos e información de formulario.
    const formData = new FormData();
    formData.append('text', text);
    formData.append('profileId', authorProfile.id);
    formData.append('authorType', authorProfile.type);
    if (image) {
      formData.append('image', image);
    }

    try {
      await api.post('/posts', formData);
      // TODO: Idealmente, aquí deberíamos invalidar el query del feed para que se actualice.
      // Por ahora, simplemente cerramos el modal.
      onClose();
    } catch (err) {
      console.error("Error al crear el post:", err);
      setError('No se pudo crear la publicación. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content create-post-modal">
        <div className="modal-header">
          <h3>Crear Publicación</h3>
          <button onClick={onClose} className="close-modal-button"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="author-selector">
            <label htmlFor="author">Publicar como:</label>
            <select 
              id="author"
              onChange={(e) => {
                const [type, id, name] = e.target.value.split(',');
                setAuthorProfile({ type, id, name });
              }}
            >
              <option value={`user,${user.uid},${user.name}`}>{user.name} (Tú)</option>
              {pets.map(pet => (
                <option key={pet.id} value={`pet,${pet.id},${pet.name}`}>{pet.name} (Mascota)</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder={`¿Qué estás pensando, ${authorProfile?.name}?`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="5"
          />
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Vista previa" className="image-preview" />
              <button type="button" onClick={() => { setImage(null); setImagePreview(null); }}>
                Quitar Imagen
              </button>
            </div>
          )}
          <div className="modal-footer">
            <label htmlFor="image-upload" className="image-upload-label">
              Añadir Foto
            </label>
            <input 
              id="image-upload"
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              style={{ display: 'none' }}
            />
            <button type="submit" className="submit-post-button" disabled={isLoading}>
              {isLoading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
