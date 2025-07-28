import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth'; // Usamos nuestro nuevo hook
import AuthPage from './AuthPage';
import FeedPage from './FeedPage';
import UserProfilePage from './UserProfilePage';
import PetSocialProfile from './PetSocialProfile';
import PetProfile from './PetProfile';
import BottomNavBar from './BottomNavBar';
import MainHeader from './MainHeader';
import NotificationsPage from './NotificationsPage';
import MapPage from './MapPage';
import EventsPage from './EventsPage';

function App() {
  const { user } = useAuth(); // Obtenemos el usuario directamente del contexto

  return (
    <div className="App">
      {/* El header y la barra de navegación solo se muestran si el usuario está logueado */}
      {user && <MainHeader />}
      <main className={user ? 'main-content' : ''}>
        <Routes>
          {/* Si no hay usuario, la ruta /login muestra AuthPage. Si ya hay usuario, redirige al feed. */}
          <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/feed" />} />
          
          {/* --- Rutas Protegidas --- */}
          {/* Solo se puede acceder a estas rutas si existe un usuario logueado. */}
          {/* Si no hay usuario, se redirige automáticamente a /login. */}
          <Route path="/feed" element={user ? <FeedPage /> : <Navigate to="/login" />} />
          <Route path="/profile/:userId" element={user ? <UserProfilePage /> : <Navigate to="/login" />} />
          <Route path="/pet/:petId/social" element={user ? <PetSocialProfile /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" />} />
          <Route path="/map" element={user ? <MapPage /> : <Navigate to="/login" />} />
          <Route path="/events" element={user ? <EventsPage /> : <Navigate to="/login" />} />

          {/* --- Ruta Pública (perfil NFC) --- */}
          {/* Esta ruta no requiere autenticación. Cualquiera puede verla. */}
          <Route path="/pet/:petId" element={<PetProfile />} />

          {/* --- Ruta por defecto --- */}
          {/* Cualquier otra URL redirigirá al feed si el usuario está logueado, o a /login si no lo está. */}
          <Route path="*" element={<Navigate to={user ? "/feed" : "/login"} />} />
        </Routes>
      </main>
      {user && <BottomNavBar />}
    </div>
  );
}

export default App;
