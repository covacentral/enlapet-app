// frontend/src/MapPage.jsx
// Versión: 1.1 - Corregido y Rediseñado
// Soluciona el bug de carga de categorías y cambia el tema del mapa a uno oscuro.

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import AddLocationModal from './AddLocationModal';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const initialPosition = [4.5709, -74.2973];

function MapPage() {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMapData = useCallback(async (categoryFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      
      const categoryUrl = `${API_URL}/api/location-categories`;
      let locationsUrl = `${API_URL}/api/locations`;
      if (categoryFilter) {
        locationsUrl += `?category=${categoryFilter}`;
      }

      // Hacemos las peticiones en paralelo
      const [categoriesRes, locationsRes] = await Promise.all([
        // Solo pedimos las categorías si aún no las tenemos
        categories.length === 0 ? fetch(categoryUrl, { headers: { 'Authorization': `Bearer ${idToken}` } }) : Promise.resolve(null),
        fetch(locationsUrl, { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);

      if (categoriesRes && !categoriesRes.ok) throw new Error('No se pudieron cargar las categorías.');
      if (!locationsRes.ok) throw new Error('No se pudieron cargar los lugares.');

      if (categoriesRes) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
      
      const locationsData = await locationsRes.json();
      setLocations(locationsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [categories]); // Dependemos de 'categories' para no volver a pedirlas

  useEffect(() => {
    fetchMapData(activeCategory);
  }, [activeCategory]); // Se ejecuta solo cuando cambia el filtro

  const handleCategoryFilter = (categoryKey) => {
    setActiveCategory(prev => prev === categoryKey ? null : categoryKey);
  };
  
  if (isLoading && categories.length === 0) {
      return <LoadingComponent text="Cargando el mapa comunitario..." />;
  }

  return (
    <>
      {isModalOpen && <AddLocationModal categories={categories} onClose={() => setIsModalOpen(false)} onLocationAdded={() => fetchMapData(activeCategory)} />}
      
      <div className="map-page-container">
        <div className="map-header">
            <h2 className="tab-title">Mapa Comunitario Pet-Friendly</h2>
            <button className="add-location-button" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Añadir Lugar
            </button>
        </div>

        <div className="map-filter-bar">
          <button 
            className={`filter-button ${!activeCategory ? 'active' : ''}`}
            onClick={() => handleCategoryFilter(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`filter-button ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(cat.key)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {error && <p className="response-message error">{error}</p>}

        <div className="map-wrapper">
          <MapContainer center={initialPosition} zoom={6} scrollWheelZoom={true} className="leaflet-container">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {locations.map(loc => (
              <Marker key={loc.id} position={[loc.coordinates._latitude, loc.coordinates._longitude]}>
                <Popup>
                  <strong>{loc.name}</strong><br />
                  {loc.address || 'Dirección no especificada.'}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
}

export default MapPage;
