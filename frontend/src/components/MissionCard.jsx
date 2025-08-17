// frontend/src/components/MissionCard.jsx
// Versión 1.1: Adapta su estructura JSX para el nuevo diseño mobile-first.

import React from 'react';
import { Trophy, CheckCircle } from 'lucide-react';

import styles from './MissionCard.module.css';
import sharedStyles from '../shared.module.css';

function MissionCard({ mission, onAccept }) {
  const { title, description, reward, status, category } = mission;

  return (
    <div className={`${styles.card} ${status === 'completed' ? styles.completed : ''}`}>
      {/* Contenedor principal para alinear ícono y texto */}
      <div className={styles.mainContent}>
        <div className={styles.iconWrapper}>
          <Trophy size={32} className={styles.icon} />
        </div>
        <div className={styles.content}>
          <span className={styles.category}>{category}</span>
          <h4 className={styles.title}>{title}</h4>
          <p className={styles.description}>{description}</p>
          <div className={styles.reward}>
            <small>Recompensa:</small>
            <span>{reward.badgeName} + {reward.points} Puntos</span>
          </div>
        </div>
      </div>
      
      {/* El contenedor de acción ahora está fuera del mainContent para el layout mobile */}
      <div className={styles.action}>
        {status === 'completed' ? (
          <div className={styles.completedBadge}>
            <CheckCircle size={20} />
            <span>Completada</span>
          </div>
        ) : (
          <button 
            className={`${sharedStyles.button} ${sharedStyles.primary}`}
            onClick={() => onAccept(mission)}
          >
            ¡Acepto el Reto!
          </button>
        )}
      </div>
    </div>
  );
}

export default MissionCard;