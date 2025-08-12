// frontend/src/components/CartIcon.jsx
// (NUEVO) Componente para el ícono del carrito en la barra de navegación o header.

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

import styles from './CartIcon.module.css';

function CartIcon({ onClick }) {
  const { itemCount } = useCart();

  return (
    <button className={styles.container} onClick={onClick}>
      {itemCount > 0 && (
        <span className={styles.badge}>{itemCount > 9 ? '9+' : itemCount}</span>
      )}
      <ShoppingCart size={28} />
    </button>
  );
}

export default CartIcon;