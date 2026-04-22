// frontend/src/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Stethoscope, AlertTriangle } from 'lucide-react';
import { auth } from './firebase';

import styles from './SearchPage.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function SearchPage() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' o 'pets'
    
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Efecto Debounce (Protección anti-spam para la base de datos)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 600); // 600ms de retraso silencioso

        return () => clearTimeout(handler);
    }, [query]);

    // 2. Fetcher de resultados
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery || debouncedQuery.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const idToken = await auth.currentUser?.getIdToken();
                const response = await fetch(`${API_URL}/api/search/${activeTab}?q=${encodeURIComponent(debouncedQuery)}`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                } else {
                    console.error("Error al buscar");
                    setResults([]);
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery, activeTab]);

    // Renderizadores de Tarjetas
    const renderUserCard = (user) => {
        const isVet = user.verification?.status === 'verified' && user.verification?.type === 'vet';

        return (
            <Link key={user.id} to={`/dashboard/user/${user.id}`} className={styles.resultCard}>
                <div className={styles.avatar}>
                    {user.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : '👤'}
                </div>
                <div className={styles.info}>
                    <div className={styles.nameRow}>
                        <h3 className={styles.name}>{user.name}</h3>
                        {isVet && (
                            <span className={styles.vetBadge}>
                                <Stethoscope size={10} /> VET
                            </span>
                        )}
                    </div>
                    {user.bio && <p className={styles.subText}>{user.bio.substring(0, 40)}{user.bio.length > 40 ? '...' : ''}</p>}
                </div>
            </Link>
        );
    };

    const renderPetCard = (pet) => {
        const isRescue = pet.rescueMode?.isActive;

        return (
            <Link key={pet.id} to={`/dashboard/pet/${pet.id}`} className={styles.resultCard}>
                <div className={styles.avatar}>
                    {pet.petPictureUrl ? (
                        <img src={pet.petPictureUrl} alt={pet.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : '🐾'}
                </div>
                <div className={styles.info}>
                    <div className={styles.nameRow}>
                        <h3 className={styles.name}>{pet.name}</h3>
                        {isRescue && (
                            <span className={styles.rescueBadge} title="Activó Modo Rescate">
                                <AlertTriangle size={10} />
                            </span>
                        )}
                    </div>
                    <p className={styles.subText}>{pet.breed || 'Mascota'}</p>
                    <span className={styles.epidBadge}>EPID: {pet.epid}</span>
                </div>
            </Link>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchHeader}>
                <div className={styles.searchInputWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        className={styles.searchInput}
                        placeholder={activeTab === 'users' ? "Buscar por nombre..." : "Buscar por Nombre o EPID..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className={styles.tabsContainer}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('users'); setResults([]); }}
                    >
                        Usuarios y Vets
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'pets' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('pets'); setResults([]); }}
                    >
                        Mascotas
                    </button>
                </div>
            </div>

            <div className={styles.resultsContainer}>
                {isLoading && (
                    <div className={styles.loader}>
                        <Loader2 className={styles.spin} size={24} />
                        <p style={{marginTop: '8px', fontSize: '14px'}}>Explorando universo EnlaPet...</p>
                    </div>
                )}

                {!isLoading && debouncedQuery.length > 1 && results.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>No se encontraron resultados para "{debouncedQuery}" en esta categoría.</p>
                    </div>
                )}

                {!isLoading && results.length > 0 && (
                    results.map(item => activeTab === 'users' ? renderUserCard(item) : renderPetCard(item))
                )}

                {!query && !isLoading && (
                    <div className={styles.emptyState} style={{opacity: 0.6}}>
                        <Search size={40} style={{margin: '0 auto 10px auto'}} />
                        <p>Escribe el nombre o EPID que deseas localizar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchPage;
