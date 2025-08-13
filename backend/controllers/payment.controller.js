// backend/controllers/payment.controller.js
// Lógica de negocio para interactuar con la pasarela de pagos ePayco.
// VERSIÓN FINAL: Utiliza el método checkout.create para redirigir al usuario a la pasarela.

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

    // --- PAYLOAD CORREGIDO PARA EL CHECKOUT ESTÁNDAR ---
    const paymentData = {
      // Obligatorios
      name: "Compra Collar Inteligente EnlaPet",
      description: `Orden de compra #${orderId}`,
      invoice: orderId,
      currency: "cop",
      amount: (orderData.totalAmount / 100).toString(),
      tax_base: "0",
      tax: "0",
      country: "co",
      lang: "es",

      // URLs
      external: "false", // Usaremos el checkout estándar de ePayco
      confirmation: `${process.env.API_URL}/api/payments/webhook`,
      response: `${process.env.FRONTEND_URL}/dashboard/order-confirmation`,

      // Datos del comprador
      name_billing: orderData.shippingAddress.fullName || userName,
      email_billing: userEmail,
      mobilephone_billing: orderData.shippingAddress.phone,
      address_billing: orderData.shippingAddress.addressLine1,
      
      // Dato extra para nuestra referencia en el webhook
      extra1: orderId,
    };

    // --- MÉTODO CORREGIDO: Usamos checkout.create en lugar de charge.create ---
    const checkout = await epaycoClient.checkout.create(paymentData);

    if (!checkout.success || !checkout.data || !checkout.data.payco_id) {
        console.error('Respuesta de ePayco (checkout) inválida:', checkout);
        throw new Error(checkout.data?.description || 'Los datos son erroneos o son requeridos por favor compruebe.');
    }
    
    // El ID de la transacción ahora es payco_id
    await orderRef.update({
        'paymentDetails.transactionId': checkout.data.payco_id,
        status: 'awaiting_payment',
        updatedAt: new Date().toISOString()
    });

    // En lugar de devolver url_banco, el SDK de checkout nos da la URL en el objeto principal
    res.status(200).json({ transactionData: { url_banco: checkout.url } });

  } catch (error) {
    console.error(`Error en createPaymentTransaction para la orden ${orderId}:`, error);
    res.status(500).json({ message: error.message || 'Error interno al procesar el pago.' });
  }
};

// (El webhook no necesita cambios)
const handleEpaycoWebhook = async (req, res) => {
    if (!epaycoClient) {
        console.error('Webhook de ePayco recibido, pero el SDK no está inicializado. Descartando.');
        return res.status(503).send('Servicio no disponible.');
    }

    const validationData = req.body;
    // Para webhooks, el ID de la transacción es ref_payco
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