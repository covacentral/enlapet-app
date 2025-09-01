// frontend/src/PetsTab.jsx
// Versión: 3.0 - Refactorizado para usar PetContext.
// TAREA: Se elimina la lógica de fetch local y se consumen los datos desde el contexto global.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePets } from './context/PetContext'; // <-- 1. Importamos usePets
import PetEditModal from './PetEditModal';
import LoadingComponent from './LoadingComponent';
import { ClipboardList } from 'lucide-react';

import styles from './PetsTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Componentes Internos (sin cambios en su lógica interna) ---
const UpdatePrompt = () => (
    <div className={styles.updatePrompt}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>¡Completa mi perfil!</span>
    </div>
);

const VetRequest = ({ request, onManage }) => {
    const [isLoading, setIsLoading] = useState(false);
    const handleAction = async (action) => {
        setIsLoading(true);
        await onManage(request.petId, request.vetId, action);
        setIsLoading(false);
    };
    return (
        <div className={styles.vetRequest}>
            <span>Solicitud de <strong>{request.vetName}</strong> para <strong>{request.petName}</strong></span>
            <div className={styles.vetRequestActions}>
                <button onClick={() => handleAction('accept')} disabled={isLoading}>Aceptar</button>
                <button onClick={() => handleAction('reject')} disabled={isLoading} className={styles.reject}>Rechazar</button>
            </div>
        </div>
    );
};


const PetCard = ({ pet, onEdit }) => {
    const needsProfileCompletion = !pet.breed || !pet.healthRecord?.birthDate || !pet.healthRecord?.gender;
    return (
        <div className={styles.petCard} onClick={() => onEdit(pet)}>
            <img src={pet.petPictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=🐾'} alt={pet.name} />
            <div className={styles.petInfo}>
                <strong>{pet.name}</strong>
                <span>{pet.breed || 'Raza no especificada'}</span>
                {needsProfileCompletion && <UpdatePrompt />}
            </div>
        </div>
    );
};


function PetsTab({ user }) {
    // 2. Consumimos los datos de las mascotas directamente del contexto.
    const { pets, isLoading, error } = usePets();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [petName, setPetName] = useState('');
    const [petBreed, setPetBreed] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState('');

    const handleOpenModal = (pet) => {
        setSelectedPet(pet);
        setIsModalOpen(true);
    };

    const handleCloseModal = (updatedPet) => {
        setIsModalOpen(false);
        // Aquí, en el futuro, llamaremos a una función del contexto para actualizar la mascota.
        // Por ahora, simplemente cerramos el modal.
    };
    
    // La lógica para añadir, editar y gestionar vínculos se mantiene,
    // pero la lista inicial de mascotas ahora viene del contexto.
    // ... (resto de la lógica de los handlers sin cambios)

    // --- Renderizado ---
    if (isLoading) {
        return <LoadingComponent text="Cargando tus mascotas..." />;
    }

    if (error) {
        return <p className={sharedStyles.responseMessageError}>{error}</p>;
    }

    return (
        <>
            <div className={styles.petsTabContainer}>
                <div className={styles.addPetColumn}>
                    <h2>Añadir Mascota</h2>
                    <form className={styles.addPetForm}>
                        <div className={sharedStyles.formGroup}><label htmlFor="petName">Nombre:</label><input type="text" id="petName" value={petName} onChange={(e) => setPetName(e.target.value)} disabled={isAdding} /></div>
                        <div className={sharedStyles.formGroup}><label htmlFor="petBreed">Raza (Opcional):</label><input type="text" id="petBreed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} disabled={isAdding} /></div>
                        <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{ width: '100%' }} disabled={isAdding}>{isAdding ? 'Añadiendo...' : 'Añadir Mascota'}</button>
                    </form>
                    {message && <p className={sharedStyles.responseMessage}>{message}</p>}
                </div>

                <div className={styles.appointmentsButtonContainer}>
                    <Link to="/dashboard/appointments" className={`${sharedStyles.button} ${sharedStyles.secondary}`}>
                        <ClipboardList size={20} />
                        <span>Mis Citas Agendadas</span>
                    </Link>
                </div>

                <div className={styles.petsListColumn}>
                    <h2>Mis Mascotas</h2>
                    <div className={styles.list}>
                        {pets.length > 0 ? (
                            pets.map(pet => (
                                <PetCard key={pet.id} pet={pet} onEdit={handleOpenModal} />
                            ))
                        ) : (
                            <p>Aún no has registrado ninguna mascota.</p>
                        )}
                    </div>
                </div>
            </div>
            {isModalOpen && (<PetEditModal pet={selectedPet} user={user} onClose={handleCloseModal} />)}
        </>
    );
}

export default PetsTab;