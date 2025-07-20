import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { colombiaData } from './colombiaData.js'; // Importamos los datos de Colombia

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Componente del Modal de Edición ---
function PetEditModal({ pet, user, onUpdate, onClose }) {
    const [formData, setFormData] = useState({
        name: pet.name || '',
        breed: pet.breed || '',
        birthDate: pet.healthRecord?.birthDate || '',
        gender: pet.healthRecord?.gender || 'No especificado',
        country: pet.location?.country || 'Colombia',
        department: pet.location?.department || '',
        city: pet.location?.city || ''
    });
    const [departments, setDepartments] = useState([]);
    const [cities, setCities] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const countryData = colombiaData; // Por ahora solo Colombia
        setDepartments(countryData.map(d => d.departamento).sort());
    }, []);

    useEffect(() => {
        if (formData.department) {
            const selectedDept = colombiaData.find(d => d.departamento === formData.department);
            setCities(selectedDept ? selectedDept.ciudades.sort() : []);
        } else {
            setCities([]);
        }
    }, [formData.department]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('Guardando cambios...');
        try {
            const idToken = await user.getIdToken();
            const payload = {
                name: formData.name,
                breed: formData.breed,
                location: {
                    country: formData.country,
                    department: formData.department,
                    city: formData.city,
                },
                healthRecord: {
                    ...pet.healthRecord, // Mantenemos datos existentes como vacunas
                    birthDate: formData.birthDate,
                    gender: formData.gender,
                }
            };

            const response = await fetch(`${API_URL}/api/pets/${pet.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setMessage('¡Perfil actualizado!');
            onUpdate();
            setTimeout(() => onClose(), 1500); // Cierra el modal después de un segundo
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content pet-edit-modal">
                <h2>Editar Perfil de {pet.name}</h2>
                <form onSubmit={handleSaveChanges}>
                    {/* Campos del formulario */}
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Raza:</label>
                        <input name="breed" value={formData.breed} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Fecha de Nacimiento:</label>
                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Género:</label>
                        <select name="gender" value={formData.gender} onChange={handleChange}>
                            <option>No especificado</option>
                            <option>Macho</option>
                            <option>Hembra</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>País:</label>
                        <input name="country" value={formData.country} disabled />
                    </div>
                    <div className="form-group">
                        <label>Departamento:</label>
                        <select name="department" value={formData.department} onChange={handleChange} required>
                            <option value="">Selecciona un departamento</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Ciudad:</label>
                        <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.department}>
                            <option value="">Selecciona una ciudad</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="modal-button cancel" disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="modal-button confirm" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                    {message && <p className="response-message">{message}</p>}
                </form>
            </div>
        </div>
    );
}


// --- Componente de la Tarjeta de Mascota (Modificado) ---
function PetCard({ pet, user, onUpdate, onEdit }) {
    return (
        <div className="pet-card">
            <div className="pet-card-image-container">
                {pet.petPictureUrl ? (
                    <img src={pet.petPictureUrl} alt={pet.name} className="pet-card-image" />
                ) : (
                    <div className="pet-card-image-placeholder">🐾</div>
                )}
            </div>
            <div className="pet-card-info">
                <div className="pet-view-info">
                    <div className="pet-name-breed-wrapper">
                        <h3>{pet.name}</h3>
                        {pet.breed && <p className="pet-breed-subtitle">{pet.breed}</p>}
                    </div>
                    {/* El botón de editar ahora abre el modal */}
                    <button className="edit-pet-button" onClick={() => onEdit(pet)}>
                        <EditIcon />
                    </button>
                </div>
                {/* Aviso para completar el perfil */}
                {!pet.isProfileComplete && (
                    <button className="complete-profile-prompt" onClick={() => onEdit(pet)}>
                        ¡Completa mi perfil!
                    </button>
                )}
                <Link to={`/pet/${pet.id}`} className="link-button view-public-button">Ver Perfil Público</Link>
            </div>
        </div>
    );
}

// --- Componente Principal de la Pestaña (Reestructurado) ---
function PetsTab({ user, initialPets, onPetsUpdate }) {
    const [pets, setPets] = useState(initialPets);
    const [message, setMessage] = useState('');
    const [formState, setFormState] = useState({ name: '', breed: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [editingPet, setEditingPet] = useState(null); // Estado para controlar el modal

    useEffect(() => {
        setPets(initialPets);
    }, [initialPets]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleAddPet = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        setMessage('Añadiendo mascota...');
        try {
            const idToken = await user.getIdToken(true);
            const response = await fetch(`${API_URL}/api/pets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(formState),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setMessage('¡Mascota añadida!');
            setFormState({ name: '', breed: '' });
            onPetsUpdate();
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsAdding(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="pets-tab-container">
            {/* El modal de edición se muestra si hay una mascota seleccionada */}
            {editingPet && (
                <PetEditModal 
                    pet={editingPet} 
                    user={user} 
                    onUpdate={onPetsUpdate}
                    onClose={() => setEditingPet(null)}
                />
            )}

            <div className="dashboard-column add-pet-column">
                <h2>Añadir Nueva Mascota</h2>
                <form onSubmit={handleAddPet} className="register-form">
                    <div className="form-group">
                        <label htmlFor="name">Nombre:</label>
                        <input type="text" id="name" name="name" value={formState.name} onChange={handleFormChange} required disabled={isAdding} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="breed">Raza (Opcional):</label>
                        <input type="text" id="breed" name="breed" value={formState.breed} onChange={handleFormChange} disabled={isAdding} />
                    </div>
                    <button type="submit" disabled={isAdding}>
                        {isAdding ? 'Añadiendo...' : 'Añadir Mascota'}
                    </button>
                </form>
                {message && <p className="response-message">{message}</p>}
            </div>
            <div className="dashboard-column pets-list-column">
                <h2>Mis Mascotas</h2>
                <div className="pets-list">
                    {pets.length > 0 ? (
                        pets.map(pet => (
                            <PetCard 
                                key={pet.id} 
                                pet={pet} 
                                user={user} 
                                onUpdate={onPetsUpdate} 
                                onEdit={setEditingPet} // Pasamos la función para abrir el modal
                            />
                        ))
                    ) : (
                        <p>Aún no has registrado ninguna mascota.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PetsTab;
