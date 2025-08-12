// frontend/src/CheckoutPage.jsx
// (NUEVO) Página para que el usuario ingrese sus datos de envío y proceda al pago.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { useCart } from './context/CartContext';
import { colombiaData } from './utils/colombiaData';

import styles from './CheckoutPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function CheckoutPage() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const [userProfile, setUserProfile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        department: 'Córdoba', // Valor por defecto
        city: 'Montería', // Valor por defecto
        phone: ''
    });
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (cartItems.length === 0) {
            // Si el carrito está vacío, no tiene sentido estar aquí.
            navigate('/dashboard');
        }
        
        // Precargamos los datos del perfil del usuario en el formulario
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (user) {
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_URL}/api/profile`, { headers: { 'Authorization': `Bearer ${idToken}` } });
                if (response.ok) {
                    const data = await response.json();
                    setUserProfile(data);
                    setFormData(prev => ({
                        ...prev,
                        fullName: data.name || '',
                        phone: data.phone || ''
                    }));
                }
            }
        };
        fetchProfile();

        // Inicializamos las ciudades para el departamento por defecto
        const initialDeptData = colombiaData.find(d => d.departamento === 'Córdoba');
        if (initialDeptData) {
            setCities(initialDeptData.ciudades);
        }

    }, [cartItems, navigate]);
    
    const handleDepartmentChange = (e) => {
        const newDepartment = e.target.value;
        setFormData({ ...formData, department: newDepartment, city: '' });
        const departmentData = colombiaData.find(d => d.departamento === newDepartment);
        setCities(departmentData ? departmentData.ciudades : []);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('Procesando tu orden...');

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Debes iniciar sesión para completar la compra.");
            const idToken = await user.getIdToken();
            
            // 1. Crear la orden en nuestro backend
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

            // 2. Crear la transacción de pago en ePayco a través de nuestro backend
            const paymentResponse = await fetch(`${API_URL}/api/payments/create-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ orderId: orderData.orderId }),
            });
            const paymentData = await paymentResponse.json();
            if (!paymentResponse.ok) throw new Error(paymentData.message || 'Error al iniciar el pago.');

            // 3. Si todo fue exitoso, limpiamos el carrito y redirigimos a ePayco
            clearCart();
            window.location.href = paymentData.transactionData.url_banco; // Redirección a la pasarela

        } catch (error) {
            setMessage(`Error: ${error.message}`);
            setIsLoading(false);
        }
    };
    
    const formatPrice = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount / 100);

    return (
        <div className={styles.container}>
            <h2 className={sharedStyles.tabTitle}>Finalizar Compra</h2>
            <div className={styles.checkoutLayout}>
                <div className={styles.formColumn}>
                    <h3>Dirección de Envío</h3>
                    <form id="checkout-form" onSubmit={handlePlaceOrder}>
                        <div className={sharedStyles.formGroup}><label>Nombre Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
                        <div className={sharedStyles.formGroup}><label>Dirección</label><input type="text" name="addressLine1" placeholder="Carrera 5 # 20-30" value={formData.addressLine1} onChange={handleChange} required /></div>
                        <div className={sharedStyles.formGroup}><label>Apartamento, Interior, etc. (Opcional)</label><input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} /></div>
                        <div className={sharedStyles.formRow}>
                            <div className={sharedStyles.formGroup}><label>Departamento</label><select name="department" value={formData.department} onChange={handleDepartmentChange} required><option disabled value="">Selecciona...</option>{colombiaData.map(d => <option key={d.departamento} value={d.departamento}>{d.departamento}</option>)}</select></div>
                            <div className={sharedStyles.formGroup}><label>Ciudad</label><select name="city" value={formData.city} onChange={handleChange} required><option disabled value="">Selecciona...</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        </div>
                        <div className={sharedStyles.formGroup}><label>Teléfono de Contacto</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
                    </form>
                </div>
                <div className={styles.summaryColumn}>
                    <h3>Resumen de la Orden</h3>
                    <div className={styles.summaryCard}>
                        {cartItems.map(item => (
                            <div key={item.id} className={styles.summaryItem}>
                                <span>{item.name} x {item.quantity}</span>
                                <span>{formatPrice(item.price.amount * item.quantity)}</span>
                            </div>
                        ))}
                        <hr className={styles.divider} />
                        <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
                            <span>Total</span>
                            <span>{formatPrice(cartTotal)}</span>
                        </div>
                    </div>
                    {message && <p className={sharedStyles.responseMessageError} style={{marginTop: '1rem'}}>{message}</p>}
                    <button 
                        type="submit" 
                        form="checkout-form"
                        className={`${sharedStyles.button} ${sharedStyles.primary}`} 
                        style={{width: '100%', marginTop: '1.5rem'}}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : `Pagar ${formatPrice(cartTotal)} con ePayco`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;