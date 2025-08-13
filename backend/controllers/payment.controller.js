// backend/controllers/payment.controller.js
// Lógica de negocio para interactuar con la pasarela de pagos ePayco.
// VERSIÓN CORREGIDA: Añade el campo 'extra1' al payload de la transacción.

const epayco = require('epayco-sdk-node');
const { db } = require('../config/firebase');

const epaycoPublicKey = process.env.EPAYCO_PUBLIC_KEY;
const epaycoPrivateKey = process.env.EPAYCO_PRIVATE_KEY;

let epaycoClient;

if (epaycoPublicKey && epaycoPrivateKey) {
  epaycoClient = epayco({
    apiKey: epaycoPublicKey,
    privateKey: epaycoPrivateKey,
    lang: 'ES',
    test: true 
  });
  console.log('SDK de ePayco inicializado correctamente.');
} else {
  console.error('¡ERROR CRÍTICO DE CONFIGURACIÓN! Las llaves de API de ePayco no están definidas en las variables de entorno. El módulo de pagos estará inactivo.');
  epaycoClient = null;
}


/**
 * Crea una transacción en ePayco y devuelve los datos para el checkout.
 */
const createPaymentTransaction = async (req, res) => {
  if (!epaycoClient) {
    return res.status(503).json({ message: 'El servicio de pagos no está disponible en este momento. Por favor, contacta a soporte.' });
  }

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
    
    if (orderData.status !== 'pending') {
        return res.status(409).json({ message: 'Esta orden ya ha sido procesada.' });
    }

    const paymentData = {
      name: "Compra Collar EnlaPet",
      description: `Orden de compra #${orderId}`,
      invoice: orderId,
      currency: "cop",
      amount: (orderData.totalAmount / 100).toString(),
      tax_base: "0",
      tax: "0",
      country: "co",
      lang: "es",
      external: "false",
      confirmation: `${process.env.API_URL}/api/payments/webhook`,
      response: `${process.env.FRONTEND_URL}/dashboard/order-confirmation`,
      name_billing: orderData.shippingAddress.fullName || userName,
      email_billing: userEmail,
      mobilephone_billing: orderData.shippingAddress.phone,
      address_billing: orderData.shippingAddress.addressLine1,
      
      // --- LÍNEA CORREGIDA ---
      // Añadimos el ID de nuestra orden como dato extra para la confirmación.
      extra1: orderId,
    };

    const charge = await epaycoClient.charge.create(paymentData);

    if (!charge.success || !charge.data || !charge.data.ref_payco) {
      console.error('Respuesta de ePayco inválida:', charge);
      throw new Error(charge.data?.description || 'Error validando datos con ePayco.');
    }
    
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
    // ...(El resto de la función no necesita cambios)...
    if (!epaycoClient) {
        console.error('Webhook de ePayco recibido, pero el SDK no está inicializado. Descartando.');
        return res.status(503).send('Servicio no disponible.');
    }

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

        await orderRef.update({
            status: newStatus,
            'paymentDetails.paymentMethod': charge.data.x_type_payment,
            updatedAt: new Date().toISOString()
        });

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