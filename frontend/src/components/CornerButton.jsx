// frontend/src/components/CornerButton.jsx
// Versión 1.0: Componente reutilizable para los botones de esquina del MainHeader.

import React from 'react';
import styles from './CornerButton.module.css';

// Simulamos los íconos de lucide-react para mantener el código desacoplado.
// En la implementación real, importaríamos directamente desde 'lucide-react'.
const Icon = ({ name, size = 24 }) => {
    const icons = {
      LayoutGrid: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
      X: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
    };
    return icons[name] || null;
};


function CornerButton({ position, iconName, onClick }) {
  // Determina la clase CSS basada en la posición proporcionada
  const positionClass = styles[position] || styles.bottomRight;

  return (
    <button
      onClick={onClick}
      className={`${styles.cornerButton} ${positionClass}`}
      aria-label="Toggle header view"
    >
      <Icon name={iconName} size={28} />
    </button>
  );
}

export default CornerButton;