// frontend/src/ProfileLayout.jsx
// Versión 4.5: Implementa el handler para 'onAcceptMission' y lo pasa al MainHeader.

import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { CartProvider } from './context/CartContext';

import styles from './ProfileLayout.module.css';

// Importación de Páginas y Componentes
import FeedPage from './FeedPage.jsx';
import SavedPostsPage from './SavedPostsPage.jsx';
import MapPage from './MapPage.jsx';
import EventsPage from './EventsPage.jsx';
import SettingsTab from './SettingsTab.jsx';
import PetsTab from './PetsTab.jsx';
import PetSocialProfile from './PetSocialProfile.jsx';
import UserProfilePage from './UserProfilePage.jsx';
import AppointmentsTab from './AppointmentsTab.jsx';
import ProductPage from './ProductPage.jsx';
import CheckoutPage from './CheckoutPage.jsx';
import OrderConfirmationPage from './OrderConfirmationPage.jsx';
import LoadingComponent from './LoadingComponent.jsx';
import BottomNavBar from './BottomNavBar.jsx';
import CreatePostModal from './CreatePostModal.jsx';
import ShoppingCartModal from './components/ShoppingCartModal.jsx';
import MainHeader from './MainHeader.jsx';
import PostDetailModal from './PostDetailModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProfileLayout({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // --- [NUEVO] Estado para el contexto de la misión ---
  const [missionContext, setMissionContext] = useState(null);
  const navigate = useNavigate();

  const fetchCoreData = useCallback(async () => {
    // ... (lógica de fetching sin cambios)
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const [profileResponse, petsResponse] = await Promise.all([
        fetch(`${API_URL}/api/profile`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`${API_URL}/api/pets`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
      ]);
      if (!profileResponse.ok || !petsResponse.ok) throw new Error("No se pudieron cargar los datos del perfil.");
      
      const profileData = await profileResponse.json();
      const petsData = await petsResponse.json();
      setUserProfile(profileData);
      setPets(Array.isArray(petsData) ? petsData : []);

    } catch (error) {
      console.error("Error fetching core data:", error);
      setPets([]);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchCoreData().finally(() => setLoading(false));
  }, [fetchCoreData]);

  // --- [NUEVO] Handler para aceptar una misión ---
  const handleAcceptMission = (mission, petId) => {
    // Guardamos los datos de la misión en el estado
    setMissionContext({
      missionId: mission.id,
      petId: petId,
      missionHashtag: mission.hashtag
    });
    // Abrimos el modal para crear el post
    setIsCreateModalOpen(true);
  };

  const handlePostCreated = (newPost) => {
    setIsCreateModalOpen(false);
    setMissionContext(null); // Limpiamos el contexto después de crear el post
    if (newPost) {
      navigate('/dashboard'); // Navegamos al feed para ver el nuevo post
    }
    fetchCoreData(); // Refrescamos los datos por si se completó una misión
  };

  const handleOpenCreatePost = () => {
    setMissionContext(null); // Aseguramos que no haya contexto de misión
    setIsCreateModalOpen(true);
  };

  if (loading) return <LoadingComponent text="Cargando tu universo EnlaPet..." />;

  return (
    <div className={styles.container}>
      {/* El modal ahora recibe el contexto de la misión */}
      {isCreateModalOpen && ( <CreatePostModal userProfile={userProfile} pets={pets} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} missionContext={missionContext} /> )}
      {isCartOpen && <ShoppingCartModal onClose={() => setIsCartOpen(false)} />}

      {/* Pasamos el nuevo handler 'handleAcceptMission' al MainHeader */}
      <MainHeader userProfile={userProfile} pets={pets} onAcceptMission={handleAcceptMission} />

      <main>
        <Routes>
          <Route index element={<FeedPage userProfile={userProfile} pets={pets} />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventsPage user={user} />} />
          <Route path="appointments" element={<AppointmentsTab userProfile={userProfile} />} />
          <Route path="saved" element={<SavedPostsPage />} />
          <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchCoreData} />} />
          <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchCoreData} />} />
          <Route path="pet/:petId" element={<PetSocialProfile user={user} onUpdate={fetchCoreData} />} />
          <Route path="user/:userId" element={<UserProfilePage pets={pets} />} />
          <Route path="store/product/:productId" element={<ProductPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation" element={<OrderConfirmationPage />} />
        </Routes>
      </main>

      <Routes>
        <Route path="notifications/post/:postId" element={<PostDetailModal />} />
      </Routes>

      <BottomNavBar 
        onOpenCreatePost={handleOpenCreatePost}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}


// --- Necesitamos envolver el ProfileLayout en el CartProvider ---
function ProfileLayoutWrapper({ user }) {
  return (
    <CartProvider>
      <ProfileLayout user={user} />
    </CartProvider>
  )
}

export default ProfileLayoutWrapper;