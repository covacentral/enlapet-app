// frontend/src/MapPage.jsx
// Versión: 1.0 - Página del Mapa Comunitario
// Muestra un mapa interactivo con lugares pet-friendly, filtros y opción de añadir.

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import AddLocationModal from './AddLocationModal'; // Lo crearemos en el siguiente paso
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Posición inicial del mapa (centrado en Colombia)
const initialPosition = [4.5709, -74.2973];

function MapPage() {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      
      const categoryUrl = `${API_URL}/api/location-categories`;
      let locationsUrl = `${API_URL}/api/locations`;
      if (activeCategory) {
        locationsUrl += `?category=${activeCategory}`;
      }

      const [categoriesRes, locationsRes] = await Promise.all([
        fetch(categoryUrl, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(locationsUrl, { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);

      if (!categoriesRes.ok) throw new Error('No se pudieron cargar las categorías.');
      if (!locationsRes.ok) throw new Error('No se pudieron cargar los lugares.');

      const categoriesData = await categoriesRes.json();
      const locationsData = await locationsRes.json();

      setCategories(categoriesData);
      setLocations(locationsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryFilter = (categoryKey) => {
    setActiveCategory(prev => prev === categoryKey ? null : categoryKey);
  };
  
  if (isLoading && locations.length === 0) {
      return <LoadingComponent text="Cargando el mapa comunitario..." />;
  }

  return (
    <>
      {isModalOpen && <AddLocationModal categories={categories} onClose={() => setIsModalOpen(false)} onLocationAdded={fetchData} />}
      
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
