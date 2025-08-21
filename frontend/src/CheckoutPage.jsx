// frontend/src/CheckoutPage.jsx
// Versión 2.1: Se alinea la importación de 'colombiaData' con el estándar del proyecto.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { useCart } from './context/CartContext';
// --- [LÍNEA CORREGIDA] ---
import { colombiaDepartments } from './utils/colombiaData';

import styles from './CheckoutPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const EPAYCO_PUBLIC_KEY = import.meta.env.VITE_EPAYCO_PUBLIC_KEY;

function CheckoutPage() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const [formData, setFormData] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        department: 'Córdoba',
        city: 'Montería',
        phone: ''
    });
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/dashboard');
        }
        
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (user) {
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_URL}/api/profile`, { headers: { 'Authorization': `Bearer ${idToken}` } });
                if (response.ok) {
                    const data = await response.json();
                    setFormData(prev => ({ ...prev, fullName: data.name || '', phone: data.phone || '' }));
                }
            }
        };
        fetchProfile();

        // --- [LÍNEA CORREGIDA] ---
        const initialDeptData = colombiaDepartments.find(d => d.department === 'Córdoba');
        if (initialDeptData) setCities(initialDeptData.cities.map(c => c.name));

    }, [cartItems, navigate]);
    
    const handleDepartmentChange = (e) => {
        const newDepartment = e.target.value;
        setFormData({ ...formData, department: newDepartment, city: '' });
        // --- [LÍNEA CORREGIDA] ---
        const departmentData = colombiaDepartments.find(d => d.department === newDepartment);
        setCities(departmentData ? departmentData.cities.map(c => c.name) : []);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('Preparando tu orden...');

        if (!EPAYCO_PUBLIC_KEY) {
            setMessage('Error de configuración: La llave pública de ePayco no está disponible.');
            setIsLoading(false);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes iniciar sesión para completar la compra.");
            const idToken = await user.getIdToken();
            
            const orderPayload = {
                items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity })),
                shippingAddress: { ...formData, country: 'Colombia' }
            };
            const orderResponse = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(orderPayload),
            });
            const orderData = await orderResponse.json();
            if (!orderResponse.ok) throw new Error(orderData.message || 'Error al crear la orden.');

            setMessage('Orden creada. Abriendo pasarela de pago...');

            const handler = window.ePayco.checkout.configure({
                key: EPAYCO_PUBLIC_KEY,
                test: true
            });

            const data = {
                name: "Compra de Productos EnlaPet",
                description: `Orden de compra #${orderData.orderId}`,
                invoice: orderData.orderId,
                currency: "cop",
                amount: (cartTotal / 100).toString(),
                tax_base: "0",
                tax: "0",
                country: "co",
                lang: "es",
                external: "false",
                extra1: orderData.orderId,
                confirmation: `${API_URL}/api/payments/epayco-confirmation`,
                response: `${window.location.origin}/dashboard/order-confirmation`,
                name_billing: formData.fullName,
                address_billing: formData.addressLine1,
                phone_billing: formData.phone,
                email_billing: user.email,
            };
            
            clearCart();
            handler.open(data);

        } catch (error) {
            setMessage(`Error: ${error.message}`);
            setIsLoading(false);
        }
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency', currency: 'COP', minimumFractionDigits: 0
        }).format(amount / 100);
    };

    return (
        <div className={sharedStyles.tabTitle} style={{textAlign: 'left'}}>
            <h2>Finalizar Compra</h2>
            <div className={styles.container}>
                <div className={styles.checkoutLayout}>
                    <div className={styles.formColumn}>
                        <h3>Dirección de Envío</h3>
                        <form onSubmit={handlePlaceOrder}>
                            <div className={sharedStyles.formGroup}><label htmlFor="fullName">Nombre Completo</label><input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
                            <div className={sharedStyles.formGroup}><label htmlFor="addressLine1">Dirección</label><input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required /></div>
                            <div className={sharedStyles.formGroup}><label htmlFor="addressLine2">Apartamento, Interior, etc. (Opcional)</label><input type="text" id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} /></div>
                            <div className={sharedStyles.formRow}>
                                <div className={sharedStyles.formGroup}><label htmlFor="department">Departamento</label><select id="department" name="department" value={formData.department} onChange={handleDepartmentChange} required><option value="" disabled>Selecciona...</option>{colombiaDepartments.map(d => <option key={d.id} value={d.department}>{d.department}</option>)}</select></div>
                                <div className={sharedStyles.formGroup}><label htmlFor="city">Ciudad</label><select id="city" name="city" value={formData.city} onChange={handleChange} disabled={cities.length === 0} required><option value="" disabled>Selecciona...</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            </div>
                            <div className={sharedStyles.formGroup}><label htmlFor="phone">Teléfono de Contacto</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required /></div>
                        </form>
                    </div>
                    <div className={styles.summaryColumn}>
                        <h3>Resumen de la Orden</h3>
                        <div className={styles.summaryCard}>
                            {cartItems.map(item => (
                                <div key={item.id} className={styles.summaryItem}>
                                    <span>{item.name} x {item.quantity}</span>
                                    <strong>{formatPrice(item.price.amount * item.quantity)}</strong>
                                </div>
                            ))}
                            <hr className={styles.divider} />
                            <div className={`${styles.summaryItem} ${styles.total}`}>
                                <span>Total</span>
                                <strong>{formatPrice(cartTotal)}</strong>
                            </div>
                            {message && <p className={sharedStyles.responseMessage}>{message}</p>}
                            <button onClick={handlePlaceOrder} className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width: '100%', marginTop: '1rem'}} disabled={isLoading}>
                                {isLoading ? 'Procesando...' : `Pagar ${formatPrice(cartTotal)}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;