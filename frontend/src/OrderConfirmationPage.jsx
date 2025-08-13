// frontend/src/OrderConfirmationPage.jsx
// Versión 2.0: Lee el estado real de la transacción desde los parámetros de la URL.

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

import styles from './OrderConfirmationPage.module.css';
import sharedStyles from './shared.module.css';

function OrderConfirmationPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading, success, rejected, pending
    const [transactionId, setTransactionId] = useState('');

    useEffect(() => {
        // 1. Leemos los parámetros que ePayco nos envía en la URL de respuesta.
        const refPayco = searchParams.get('ref_payco');
        // El código 'x_cod_response' nos dice el estado de la transacción:
        // 1 = Aceptada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida
        const transactionState = searchParams.get('x_cod_response');

        setTransactionId(refPayco || 'N/A');

        // 2. Determinamos el estado basado en el código de respuesta.
        switch (transactionState) {
            case '1':
                setStatus('success');
                break;
            case '2':
            case '4':
                setStatus('rejected');
                break;
            case '3':
                setStatus('pending');
                break;
            default:
                // Si no hay un código claro, lo dejamos como pendiente para revisión.
                setStatus('pending');
                break;
        }

    }, [searchParams]);

    const renderContent = () => {
        switch (status) {
            case 'success':
                return {
                    icon: <CheckCircle size={64} className={styles.iconSuccess} />,
                    title: '¡Pago Exitoso!',
                    message: 'Hemos recibido tu pago correctamente. Tu orden está siendo procesada y te notificaremos cuando sea enviada.',
                    showOrderId: true
                };
            case 'rejected':
                return {
                    icon: <XCircle size={64} className={styles.iconRejected} />,
                    title: 'Pago Rechazado',
                    message: 'La transacción fue rechazada. Por favor, intenta de nuevo o contacta a tu banco.',
                    showOrderId: false
                };
            case 'pending':
                return {
                    icon: <AlertCircle size={64} className={styles.iconPending} />,
                    title: 'Pago Pendiente',
                    message: 'Tu pago está pendiente de confirmación por parte de la entidad bancaria. Te notificaremos una vez que sea aprobado.',
                    showOrderId: true
                };
            default: // 'loading'
                return {
                    icon: <Loader size={64} className={styles.iconLoading} />,
                    title: 'Verificando estado del pago...',
                    message: 'Por favor, espera un momento.',
                    showOrderId: false
                };
        }
    };

    const { icon, title, message, showOrderId } = renderContent();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {icon}
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.message}>{message}</p>
                {showOrderId && <p className={styles.orderId}>ID de Transacción: {transactionId}</p>}
                <Link to="/dashboard/settings" className={`${sharedStyles.button} ${sharedStyles.primary}`}>
                    Ver Mis Compras
                </Link>
            </div>
        </div>
    );
}

export default OrderConfirmationPage;