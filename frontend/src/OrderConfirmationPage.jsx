// frontend/src/OrderConfirmationPage.jsx
// Versión 3.0: Implementa la doble verificación consultando el estado real de la orden al backend.

import React, 'useState', useEffect, useCallback } from 'react';
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

            // 1. Llamamos a nuestro nuevo endpoint en el backend para obtener el estado real
            const response = await fetch(`${API_URL}/api/orders/${orderIdToVerify}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (!response.ok) {
                // Si la orden no se encuentra o hay un error, lo marcamos como pendiente para revisión
                setStatus('pending');
                return;
            }

            const orderData = await response.json();

            // 2. Mapeamos el estado de nuestra base de datos al estado de esta página
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
            setStatus('pending'); // En caso de error, mostramos pendiente
        }
    }, []);

    useEffect(() => {
        // ePayco nos devuelve nuestro ID de orden en el parámetro 'x_extra1'
        const orderIdFromUrl = searchParams.get('x_extra1');
        const refPayco = searchParams.get('ref_payco');

        setTransactionId(refPayco || 'N/A');
        
        if (orderIdFromUrl) {
            setOrderId(orderIdFromUrl);
            // 3. Iniciamos la verificación con nuestro backend
            verifyOrderStatus(orderIdFromUrl);
        } else {
            // Si por alguna razón no tenemos un ID de orden, mostramos pendiente
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