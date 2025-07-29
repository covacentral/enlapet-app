import React, { useState, useEffect } from 'react';
import api from './services/api';
import LoadingComponent from './LoadingComponent';

const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        // Llamamos al endpoint correcto que sí existe en nuestro backend
        const response = await api.get('/locations');
        setLocations(response.data);
      } catch (err) {
        setError("No se pudieron cargar las ubicaciones.");
        console.error("Error al obtener las ubicaciones:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []); // El array vacío asegura que la llamada se haga solo una vez

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="map-page">
      <div className="page-header">
        <h2>Mapa Comunitario</h2>
        <button className="add-location-button">+ Sugerir Lugar</button>
      </div>

      {/* Placeholder para el mapa interactivo que se implementará en el futuro */}
      <div className="map-placeholder">
        <p>El mapa interactivo se mostrará aquí.</p>
      </div>

      <div className="locations-list">
        <h3>Lugares Destacados:</h3>
        {locations.length > 0 ? (
          <ul>
            {locations.map(loc => (
              <li key={loc.id}>{loc.name} - ({loc.category})</li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>No hay lugares sugeridos todavía.</p>
        )}
      </div>
    </div>
  );
};

export default MapPage;
