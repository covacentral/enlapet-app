// frontend/src/PetsTab.jsx
// Versión: 3.1 - CORREGIDO. Restaura la estructura JSX de PetCard para arreglar el layout.
// TAREA: Se reintroduce el div .imageContainer para que los estilos de la imagen se apliquen correctamente.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePets } from './context/PetContext';
import PetEditModal from './PetEditModal';
import LoadingComponent from './LoadingComponent';
import { ClipboardList } from 'lucide-react';

import styles from './PetsTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Subcomponentes (UpdatePrompt y VetRequest sin cambios) ---
const UpdatePrompt = () => (
    <div className={styles.updatePrompt}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>¡Completa mi perfil!</span>
    </div>
);

const VetRequest = ({ request, onManage }) => {
    // ... (lógica interna sin cambios)
};

// --- [COMPONENTE CORREGIDO] ---
const PetCard = ({ pet, onEdit }) => {
    const needsProfileCompletion = !pet.breed || !pet.healthRecord?.birthDate || !pet.healthRecord?.gender;
    return (
        // Se añade el evento onClick al div principal para mantener la funcionalidad.
        <div className={styles.petCard} onClick={() => onEdit(pet)}>
            {/* 1. Se restaura el DIV contenedor para la imagen */}
            <div className={styles.imageContainer}>
                <img 
                    src={pet.petPictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=🐾'} 
                    alt={pet.name} 
                    // 2. Se restaura la clase de la imagen
                    className={styles.image} 
                />
            </div>
            <div className={styles.petInfo}>
                <strong>{pet.name}</strong>
                <span>{pet.breed || 'Raza no especificada'}</span>
                {needsProfileCompletion && <UpdatePrompt />}
            </div>
        </div>
    );
};


function PetsTab({ user }) {
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

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    
    // El resto de la lógica del componente principal no necesita cambios.
    // ...

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