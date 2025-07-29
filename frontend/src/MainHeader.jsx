import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './services/api';

const MainHeader = () => {
  const { user, setUser } = useAuth();
  const [pets, setPets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPets = async () => {
      console.log('[MainHeader] Iniciando fetchPets...');
      if (user) {
        try {
          console.log('[MainHeader] Usuario encontrado en el contexto. Solicitando mascotas a /api/pets...');
          const response = await api.get('/pets');

          // --- LOG DE DEPURACIÓN CRÍTICO ---
          console.log('[MainHeader] Respuesta de /api/pets recibida:', response);

          if (!response || !response.data) {
            throw new Error("La respuesta de la API de mascotas no tiene el formato esperado.");
          }

          setPets(response.data);
          console.log('[MainHeader] Mascotas actualizadas en el estado del header:', response.data);

        } catch (error) {
          // --- LOG DE ERROR CRÍTICO ---
          console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
          console.error('[MainHeader] ERROR FATAL al obtener las mascotas:', error);
          if (error.response) {
            console.error('[MainHeader] Datos del error de la API:', error.response.data);
            console.error('[MainHeader] Estado del error de la API:', error.response.status);
          }
          console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        }
      } else {
        console.log('[MainHeader] No hay usuario en el contexto, no se piden mascotas.');
      }
    };

    fetchPets();
  }, [user]); // Se ejecuta cada vez que el objeto 'user' cambia.

  const handleLogout = () => {
    auth.signOut().then(() => {
      setUser(null);
      navigate('/login');
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  };

  console.log('[MainHeader] Renderizando componente. Usuario:', user);

  if (!user) {
    console.log('[MainHeader] No hay usuario, renderizando null.');
    return null; // No renderizar nada si no hay usuario
  }

  return (
    <header className="main-header">
      <div className="user-profile-section">
        <Link to={`/profile/${user.uid}`}>
          <img 
            src={user.profilePictureUrl || 'https://placehold.co/100x100/EFEFEF/333333?text=User'} 
            alt="Perfil" 
            className="user-profile-pic"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/EFEFEF/333333?text=Error'; }}
          />
        </Link>
        <div className="user-info">
          <h2>{user.name || 'Usuario'}</h2>
          <div className="pet-bubbles">
            {pets.map(pet => (
              <Link key={pet.id} to={`/pet/${pet.id}/social`}>
                <img 
                  src={pet.profilePictureUrl || 'https://placehold.co/50x50/CCCCCC/FFFFFF?text=Pet'} 
                  alt={pet.name} 
                  className="pet-bubble"
                  onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/50x50/CCCCCC/FFFFFF?text=Error'; }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="header-actions">
        {/* Aquí podrías añadir iconos para notificaciones, etc. */}
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </div>
    </header>
  );
};

export default MainHeader;

