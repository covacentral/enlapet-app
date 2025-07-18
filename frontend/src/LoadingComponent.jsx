import React from 'react';
import './App.css';

// Este es nuestro nuevo componente reutilizable.
// Acepta un 'text' para mostrar un mensaje personalizado.
function LoadingComponent({ text = "Cargando..." }) {
  return (
    <div className="loading-overlay">
      <div className="paw-prints-container">
        {/* Usamos 8 huellas para un camino más largo y natural */}
        <div className="paw-print paw-1">🐾</div>
        <div className="paw-print paw-2">🐾</div>
        <div className="paw-print paw-3">🐾</div>
        <div className="paw-print paw-4">🐾</div>
        <div className="paw-print paw-5">🐾</div>
        <div className="paw-print paw-6">🐾</div>
        <div className="paw-print paw-7">🐾</div>
        <div className="paw-print paw-8">🐾</div>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
}

export default LoadingComponent;
