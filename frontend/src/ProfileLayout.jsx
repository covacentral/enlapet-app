// frontend/src/ProfileLayout.jsx
// Versión 5.0: Añade la ruta faltante para el Panel de Veterinario.

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
import MainHeader from './MainHeader.jsx';
import PostDetailModal from './PostDetailModal.jsx';
import LostAndFoundPage from './LostAndFoundPage.jsx';
import RescueModeModal from './components/RescueModeModal.jsx';
import NotificationsPage from './NotificationsPage.jsx';
// --- 1. IMPORTAMOS el componente del panel de veterinario ---
import VetDashboardPage from './VetDashboardPage.jsx';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProfileLayout({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionContext, setMissionContext] = useState(null);
  const navigate = useNavigate();

  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [petForRescue, setPetForRescue] = useState(null);
  
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCoreData = useCallback(async (retryCount = 0) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const [profileResponse, petsResponse] = await Promise.all([
        fetch(`${API_URL}/api/profile`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`${API_URL}/api/pets`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
      ]);
      
      if (!profileResponse.ok) {
          // Si el perfil no existe aún (posible carrera con el registro en el backend), reintentamos unas veces.
          if (profileResponse.status === 404 && retryCount < 3) {
              console.warn(`Perfil no encontrado, reintentando carga (${retryCount + 1}/3)...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return fetchCoreData(retryCount + 1);
          }
          throw new Error("No se pudieron cargar los datos del perfil.");
      }
      
      const profileData = await profileResponse.json();
      const petsData = petsResponse.ok ? await petsResponse.json() : [];
      setUserProfile(profileData);
      setPets(Array.isArray(petsData) ? petsData : []);

    } catch (error) {
      console.error("Error fetching core data:", error);
      if (retryCount < 3) {
          console.warn(`Error de red, reintentando carga (${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchCoreData(retryCount + 1);
      } else {
          setPets([]);
      }
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.count);
        }
    } catch (error) {
        console.error("Error fetching unread count:", error);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
        fetchCoreData(),
        fetchUnreadCount()
    ]).finally(() => setLoading(false));

    const interval = setInterval(fetchUnreadCount, 60000); 
    return () => clearInterval(interval);
  }, [fetchCoreData, fetchUnreadCount]);

  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
        const idToken = await user.getIdToken();
        await fetch(`${API_URL}/api/notifications/mark-as-read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        setUnreadCount(0);
    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
  };


  const handleAcceptMission = (mission, petId) => {
    setMissionContext({ missionId: mission.id, petId: petId, missionHashtag: mission.hashtag });
    setIsCreateModalOpen(true);
  };

  const handlePostCreated = (newPost) => {
    setIsCreateModalOpen(false);
    setMissionContext(null);
    if (newPost) {
      navigate('/dashboard');
    }
    fetchCoreData();
  };

  const handleOpenCreatePost = () => {
    setMissionContext(null);
    setIsCreateModalOpen(true);
  };
  
  const handleOpenRescueModal = (pet) => {
    setPetForRescue(pet);
    setIsRescueModalOpen(true);
  };

  const handleRescueSuccess = () => {
    fetchCoreData();
  };

  if (loading) return <LoadingComponent text="Cargando tu universo EnlaPet..." />;

  return (
    <div className={styles.container}>
      {isCreateModalOpen && ( <CreatePostModal userProfile={userProfile} pets={pets} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} missionContext={missionContext} /> )}
      
      {isRescueModalOpen && petForRescue && (
        <RescueModeModal 
            pet={petForRescue}
            onClose={() => setIsRescueModalOpen(false)}
            onSuccess={handleRescueSuccess}
        />
      )}

      <MainHeader 
        userProfile={userProfile} 
        pets={pets} 
        onAcceptMission={handleAcceptMission} 
        onOpenRescueModal={handleOpenRescueModal} 
      />

      <main>
        <Routes>
          <Route index element={<FeedPage userProfile={userProfile} pets={pets} />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventsPage user={user} />} />
          <Route path="rescue" element={<LostAndFoundPage />} />
          <Route path="appointments" element={<AppointmentsTab userProfile={userProfile} />} />
          <Route path="saved" element={<SavedPostsPage />} />
          <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchCoreData} />} />
          <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchCoreData} />} />
          <Route path="pet/:petId" element={<PetSocialProfile user={user} onUpdate={fetchCoreData} />} />
          <Route path="user/:userId" element={<UserProfilePage pets={pets} />} />
          <Route path="store/product/:productId" element={<ProductPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="notifications" element={<NotificationsPage onMarkAsRead={handleMarkAsRead} />} />
          
          {/* --- 2. AÑADIMOS la ruta faltante para el panel --- */}
          <Route path="vet-panel" element={<VetDashboardPage userProfile={userProfile} />} />
        </Routes>
      </main>

      <Routes>
        <Route path="notifications/post/:postId" element={<PostDetailModal />} />
      </Routes>

      <BottomNavBar onOpenCreatePost={handleOpenCreatePost} notificationCount={unreadCount} />
    </div>
  );
}

function ProfileLayoutWrapper({ user }) {
  return (
    <CartProvider>
      <ProfileLayout user={user} />
    </CartProvider>
  )
}

export default ProfileLayoutWrapper;