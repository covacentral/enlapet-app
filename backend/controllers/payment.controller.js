// backend/controllers/payment.controller.js
// Lógica de negocio para interactuar con la pasarela de pagos ePayco.

const epayco = require('epayco-sdk-node');
const { db } = require('../config/firebase');

// 1. Inicializamos el SDK de ePayco con las credenciales del entorno
// ASEGÚRATE DE AÑADIR ESTAS VARIABLES A TU ARCHIVO .env Y A RENDER
const epaycoClient = epayco({
  apiKey: process.env.EPAYCO_PUBLIC_KEY,
  privateKey: process.env.EPAYCO_PRIVATE_KEY,
  lang: 'ES',
  test: true // ¡IMPORTANTE! Poner a 'false' para producción real.
});


/**
 * Crea una transacción en ePayco y devuelve los datos para el checkout.
 */
const createPaymentTransaction = async (req, res) => {
  const { uid: userId, name: userName, email: userEmail } = req.user;
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Se requiere el ID de la orden.' });
  }

  try {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists || orderDoc.data().userId !== userId) {
      return res.status(404).json({ message: 'Orden no encontrada o no pertenece al usuario.' });
    }

    const orderData = orderDoc.data();

    // No permitir pagar una orden que no esté 'pending'
    if (orderData.status !== 'pending') {
        return res.status(409).json({ message: 'Esta orden ya ha sido procesada.' });
    }

    // 2. Preparamos los datos para ePayco
    const paymentData = {
      // Obligatorios
      name: "Compra Collar EnlaPet", // Nombre genérico de la factura
      description: `Orden de compra #${orderId}`,
      invoice: orderId,
      currency: "cop",
      amount: (orderData.totalAmount / 100).toString(), // ePayco requiere el monto como string y en la unidad principal
      tax_base: "0",
      tax: "0",
      country: "co",
      lang: "es",

      // URLs a las que ePayco redirigirá al usuario o notificará a nuestro sistema
      // DEBES REEMPLAZAR 'https://tu-dominio.com' CON TU URL DE PRODUCCIÓN
      external: "false",
      confirmation: `${process.env.API_URL}/api/payments/webhook`,
      response: `${process.env.FRONTEND_URL}/dashboard/order-confirmation`, // Página de agradecimiento en el frontend

      // Datos del comprador
      name_billing: orderData.shippingAddress.fullName || userName,
      email_billing: userEmail,
      mobilephone_billing: orderData.shippingAddress.phone,
      address_billing: orderData.shippingAddress.addressLine1
    };

    // 3. Usamos el SDK para crear el objeto de la transacción
    const charge = await epaycoClient.charge.create(paymentData);

    if (!charge.success) {
      throw new Error(charge.message || 'Error al crear la transacción en ePayco.');
    }
    
    // 4. Actualizamos nuestra orden con el ID de la transacción y cambiamos su estado
    await orderRef.update({
        'paymentDetails.transactionId': charge.data.ref_payco,
        status: 'awaiting_payment',
        updatedAt: new Date().toISOString()
    });

    res.status(200).json({ transactionData: charge.data });

  } catch (error) {
    console.error(`Error en createPaymentTransaction para la orden ${orderId}:`, error);
    res.status(500).json({ message: error.message || 'Error interno al procesar el pago.' });
  }
};


/**
 * Maneja las confirmaciones de pago (webhook) enviadas por ePayco.
 */
const handleEpaycoWebhook = async (req, res) => {
    // El SDK de ePayco no provee un método directo para validar webhooks,
    // se hace a través de la consulta del estado de la transacción.
    const validationData = req.body;
    const transactionId = validationData.x_ref_payco;

    try {
        if (!transactionId) {
            return res.status(400).send('No se recibió x_ref_payco.');
        }

        const charge = await epaycoClient.charge.get(transactionId);
        
        if (!charge.success) {
            throw new Error(`ePayco no pudo obtener la transacción ${transactionId}`);
        }

        const { x_cod_transaction_state, x_extra1: orderId } = charge.data;
        const orderRef = db.collection('orders').doc(orderId);

        let newStatus;
        if (x_cod_transaction_state === "1") { // 1 = Aceptada
            newStatus = 'paid';
        } else if (x_cod_transaction_state === "2" || x_cod_transaction_state === "4") { // 2 = Rechazada, 4 = Fallida
            newStatus = 'cancelled';
        } else { // 3 = Pendiente
            newStatus = 'awaiting_payment';
        }

        // Actualizamos el estado de la orden en nuestra base de datos
        await orderRef.update({
            status: newStatus,
            'paymentDetails.paymentMethod': charge.data.x_type_payment,
            updatedAt: new Date().toISOString()
        });

        // Respondemos a ePayco con un 200 OK para que sepa que recibimos la notificación
        res.status(200).send('Webhook recibido y procesado.');

    } catch (error) {
        console.error(`Error en el webhook de ePayco para la transacción ${transactionId}:`, error);
        res.status(500).send('Error interno al procesar el webhook.');
    }
};


module.exports = {
    createPaymentTransaction,
    handleEpaycoWebhook
};