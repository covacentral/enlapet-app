// frontend/src/OrderConfirmationPage.jsx
// Versión 3.1: Corrige un error de sintaxis en la importación de hooks.

import React, { useState, useEffect, useCallback } from 'react'; // <-- LÍNEA CORREGIDA
import { useSearchParams, Link } from 'react-router-dom';
import { auth } from './firebase';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

import styles from './OrderConfirmationPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function OrderConfirmationPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading, success, rejected, cancelled, pending
    const [transactionId, setTransactionId] = useState('');
    const [orderId, setOrderId] = useState('');

    const verifyOrderStatus = useCallback(async (orderIdToVerify) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuario no autenticado.");
            const idToken = await user.getIdToken();

            const response = await fetch(`${API_URL}/api/orders/${orderIdToVerify}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (!response.ok) {
                setStatus('pending');
                return;
            }

            const orderData = await response.json();

            switch (orderData.status) {
                case 'paid':
                    setStatus('success');
                    break;
                case 'cancelled':
                    setStatus('rejected');
                    break;
                case 'awaiting_payment':
                    setStatus('pending');
                    break;
                default:
                    setStatus('pending');
                    break;
            }
        } catch (error) {
            console.error("Error verificando el estado de la orden:", error);
            setStatus('pending');
        }
    }, []);

    useEffect(() => {
        const orderIdFromUrl = searchParams.get('x_extra1');
        const refPayco = searchParams.get('ref_payco');

        setTransactionId(refPayco || 'N/A');
        
        if (orderIdFromUrl) {
            setOrderId(orderIdFromUrl);
            verifyOrderStatus(orderIdFromUrl);
        } else {
            setStatus('pending');
        }
    }, [searchParams, verifyOrderStatus]);

    const renderContent = () => {
        switch (status) {
            case 'success':
                return { icon: <CheckCircle size={64} className={styles.iconSuccess} />, title: '¡Pago Exitoso!', message: 'Hemos recibido tu pago correctamente. Tu orden está siendo procesada y te notificaremos cuando sea enviada.' };
            case 'rejected':
                return { icon: <XCircle size={64} className={styles.iconRejected} />, title: 'Pago Rechazado', message: 'La transacción fue rechazada. No se ha realizado ningún cobro.' };
            case 'pending':
                return { icon: <AlertCircle size={64} className={styles.iconPending} />, title: 'Pago Pendiente', message: 'Tu pago está pendiente de confirmación. Revisa tu historial de compras para ver el estado final.' };
            default: // 'loading'
                return { icon: <Loader size={64} className={styles.iconLoading} />, title: 'Verificando tu compra...', message: 'Estamos confirmando el estado de tu pago. Por favor, espera un momento.' };
        }
    };

    const { icon, title, message } = renderContent();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {icon}
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.message}>{message}</p>
                {status !== 'loading' && <p className={styles.orderId}>ID de Transacción: {transactionId}</p>}
                <Link to="/dashboard/settings" className={`${sharedStyles.button} ${sharedStyles.primary}`}>
                    Ver Mis Compras
                </Link>
            </div>
        </div>
    );
}

export default OrderConfirmationPage;