// frontend/src/OrderConfirmationPage.jsx
// (NUEVO) Página a la que el usuario es redirigido después de un intento de pago.

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import styles from './OrderConfirmationPage.module.css';
import sharedStyles from './shared.module.css';

function OrderConfirmationPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading, success, rejected, pending
    const [transactionId, setTransactionId] = useState('');

    useEffect(() => {
        // ePayco devuelve el estado de la transacción en el parámetro 'ref_payco' y otros.
        // Aquí simulamos la lectura. En producción, consultaríamos el estado real de la transacción.
        const refPayco = searchParams.get('ref_payco');
        // Para pruebas, puedes añadir ?status=success a la URL
        const mockStatus = searchParams.get('status'); 

        setTransactionId(refPayco || 'N/A');

        if (mockStatus === 'success') {
            setStatus('success');
        } else if (mockStatus === 'rejected') {
            setStatus('rejected');
        } else {
            // Lógica real basada en la documentación de ePayco (generalmente consultando el backend)
            // Por ahora, asumimos éxito si hay un ref_payco
            if (refPayco) {
                setStatus('success');
            } else {
                setStatus('rejected');
            }
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
                    message: 'Hubo un problema procesando tu pago. Por favor, intenta de nuevo o contacta a tu banco.',
                    showOrderId: false
                };
            case 'pending':
                return {
                    icon: <AlertCircle size={64} className={styles.iconPending} />,
                    title: 'Pago Pendiente',
                    message: 'Tu pago está pendiente de confirmación. Te notificaremos una vez que sea aprobado.',
                    showOrderId: true
                };
            default:
                return {
                    icon: null,
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
                <Link to="/dashboard" className={`${sharedStyles.button} ${sharedStyles.primary}`}>
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}

export default OrderConfirmationPage;