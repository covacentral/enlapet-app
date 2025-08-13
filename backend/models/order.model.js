// backend/models/order.model.js
// Define la estructura para un documento de orden de compra en Firestore.

/**
 * @typedef {'pending' | 'awaiting_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled'} OrderStatus
 * El estado de la orden:
 * - pending: El carrito fue creado, pero el usuario no ha iniciado el pago.
 * - awaiting_payment: El usuario fue redirigido a la pasarela, estamos esperando confirmación.
 * - paid: El pago fue confirmado por la pasarela.
 * - shipped: El producto ha sido enviado.
 * - delivered: El producto fue entregado.
 * - cancelled: La orden fue cancelada.
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} productId - ID del producto en la colección 'products'.
 * @property {string} name - Nombre del producto en el momento de la compra.
 * @property {number} quantity - Cantidad de este producto.
 * @property {number} unitPrice - Precio por unidad en centavos.
 */

/**
 * @typedef {Object} ShippingAddress
 * @property {string} fullName - Nombre completo del destinatario.
 * @property {string} addressLine1 - Dirección principal.
 * @property {string} addressLine2 - (Opcional) Complemento de la dirección.
 * @property {string} city - Ciudad.
 * @property {string} department - Departamento.
 * @property {string} country - País (por defecto 'Colombia').
 * @property {string} postalCode - (Opcional) Código postal.
 * @property {string} phone - Teléfono de contacto.
 */

/**
 * Devuelve el objeto base para una nueva orden de compra.
 * @param {Object} data - Datos para la nueva orden.
 * @param {string} data.userId - UID del comprador.
 * @param {Array<OrderItem>} data.items - Array de productos en la orden.
 * @param {number} data.totalAmount - Monto total en centavos.
 * @param {ShippingAddress} data.shippingAddress - Dirección de envío.
 * @returns {Object} El objeto de orden para Firestore.
 */
const getNewOrder = ({ userId, items, totalAmount, shippingAddress }) => ({
    userId,
    items,
    totalAmount, // en centavos
    currency: 'COP',
    /** @type {OrderStatus} */
    status: 'pending',
    shippingAddress,
    shippingProvider: null, // ej. 'Interrapidísimo'
    trackingNumber: null,
    paymentDetails: {
      transactionId: null,
      paymentMethod: null, // ej. 'credit_card', 'pse', 'addi'
      gateway: 'ePayco', // Pasarela de pago utilizada
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  module.exports = {
    getNewOrder
  };