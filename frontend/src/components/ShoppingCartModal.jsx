// frontend/src/components/ShoppingCartModal.jsx
// (NUEVO) Componente modal para mostrar y gestionar el carrito de compras.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { X, Trash2 } from 'lucide-react';

import styles from './ShoppingCartModal.module.css';
import sharedStyles from '../shared.module.css';

const formatPrice = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount / 100);
};

function ShoppingCartModal({ onClose }) {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose(); // Cerramos el modal
        navigate('/dashboard/checkout'); // Navegamos a la página de pago
    };

    return (
        <div className={sharedStyles.modalBackdrop} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <div className={sharedStyles.modalHeader}>
                    <h2>Tu Carrito ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</h2>
                    <button onClick={onClose} className={sharedStyles.closeButton}>
                        <X size={24} />
                    </button>
                </div>
                
                <div className={styles.body}>
                    {cartItems.length > 0 ? (
                        cartItems.map(item => (
                            <div key={item.id} className={styles.cartItem}>
                                <img 
                                    src={item.imageUrl || "https://placehold.co/100x100/0f172a/FDFBF5?text=EnlaPet"} 
                                    alt={item.name} 
                                    className={styles.itemImage} 
                                />
                                <div className={styles.itemDetails}>
                                    <p className={styles.itemName}>{item.name}</p>
                                    <p className={styles.itemPrice}>{formatPrice(item.price.amount)}</p>
                                </div>
                                <div className={styles.itemActions}>
                                    <div className={styles.quantityControl}>
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className={styles.removeButton}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.emptyCartMessage}>Tu carrito de compras está vacío.</p>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className={sharedStyles.modalFooter}>
                        <div className={styles.summary}>
                            <span>Total</span>
                            <span className={styles.totalAmount}>{formatPrice(cartTotal)}</span>
                        </div>
                        <button 
                            className={`${sharedStyles.button} ${sharedStyles.primary}`} 
                            style={{width: '100%'}}
                            onClick={handleCheckout}
                        >
                            Proceder al Pago
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShoppingCartModal;