// frontend/src/MyOrdersTab.jsx
// (NUEVO) Componente para mostrar el historial de órdenes del usuario.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import styles from './MyOrdersTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const formatPrice = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount / 100);
};

const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

const getStatusInfo = (status) => {
    switch (status) {
        case 'paid': return { text: 'Pagado', className: styles.paid };
        case 'shipped': return { text: 'Enviado', className: styles.shipped };
        case 'delivered': return { text: 'Entregado', className: styles.delivered };
        case 'cancelled': return { text: 'Cancelado', className: styles.cancelled };
        case 'awaiting_payment': return { text: 'Esperando Pago', className: styles.pending };
        default: return { text: 'Pendiente', className: styles.pending };
    }
};

function MyOrdersTab() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No autenticado.");
            const idToken = await user.getIdToken();

            const response = await fetch(`${API_URL}/api/orders`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error('No se pudo cargar el historial de órdenes.');
            
            const data = await response.json();
            setOrders(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    if (isLoading) {
        return <p>Cargando tu historial de compras...</p>;
    }

    if (error) {
        return <p className={sharedStyles.responseMessageError}>{error}</p>;
    }

    return (
        <div className={styles.container}>
            {orders.length > 0 ? (
                orders.map(order => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                        <div key={order.id} className={styles.orderCard}>
                            <div className={styles.orderHeader}>
                                <div>
                                    <span className={styles.orderDate}>Pedido realizado el {formatDate(order.createdAt)}</span>
                                    <h4 className={styles.orderTotal}>{formatPrice(order.totalAmount)}</h4>
                                </div>
                                <span className={`${styles.statusBadge} ${statusInfo.className}`}>{statusInfo.text}</span>
                            </div>
                            <div className={styles.orderBody}>
                                {order.items.map(item => (
                                    <div key={item.productId} className={styles.orderItem}>
                                        <span>{item.name} (x{item.quantity})</span>
                                        <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <p>Aún no has realizado ninguna compra.</p>
            )}
        </div>
    );
}

export default MyOrdersTab;