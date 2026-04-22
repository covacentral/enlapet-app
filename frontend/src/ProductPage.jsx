// frontend/src/ProductPage.jsx
// Versión 1.1: Conecta el botón "Añadir al Carrito" al CartContext.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import LoadingComponent from './LoadingComponent';
import styles from './ProductPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/public/products/${productId}`);
      if (!response.ok) {
        throw new Error('No se pudo cargar la información del producto.');
      }
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // Eliminamos los datos de ejemplo y llamamos a la API real.
    fetchProduct();
  }, [fetchProduct]);

  const handleWhatsAppPurchase = () => {
    // Leemos el contacto configurado en la base de datos o usamos el predeterminado
    const waNumber = product.whatsappContact || '573218248087';
    const waMessage = product.whatsappMessage || '¡Hola Cova Central! Me interesa el collar enlapet.';
    
    // Codificamos el mensaje y construimos la URL dinámica
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
    
    window.open(waUrl, '_blank');
  };

  const formatPrice = (amount, currency) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  if (isLoading) return <LoadingComponent text="Cargando nuestra tienda..." />;
  if (error) return <div className={sharedStyles.responseMessageError} style={{padding: '2rem'}}>{error}</div>;
  if (!product) return <div className={styles.container}><p>Producto no disponible.</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.imageColumn}>
        <img src={product.imageUrl || "https://placehold.co/600x600/0f172a/FDFBF5?text=EnlaPet"} alt={product.name} className={styles.mainImage} />
      </div>
      <div className={styles.detailsColumn}>
        <h1 className={styles.productName}>{product.name}</h1>
        <p className={styles.productPrice}>{formatPrice(product.price.amount, product.price.currency)}</p>
        <p className={styles.productDescription}>{product.description || "La mejor forma de mantener a tu mascota segura y conectada."}</p>
        
        {/* En un futuro, las características también vendrán de la base de datos */}
        <ul className={styles.featureList}>
            <li>Perfil de Rescate Inmediato con NFC</li>
            <li>Resistente al agua y al polvo (IP67)</li>
            <li>Diseño ligero y cómodo para todas las razas</li>
            <li>Acceso a la red social y comunidad EnlaPet</li>
            <li>No requiere baterías ni carga</li>
        </ul>

        <div className={styles.actions}>
            <button 
                className={styles.whatsappButton}
                onClick={handleWhatsAppPurchase}
            >
                <MessageCircle size={22} />
                <span>Comprar por WhatsApp</span>
            </button>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;