// backend/controllers/payment.controller.js
// Lógica de negocio para interactuar con la pasarela de pagos ePayco.
// VERSIÓN SIMPLIFICADA: Solo contiene la lógica para el webhook de confirmación.

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
  console.log('SDK de ePayco inicializado correctamente para webhooks.');
} else {
  console.error('¡ERROR CRÍTICO DE CONFIGURACIÓN! Las llaves de API de ePayco no están definidas. El webhook de pagos no funcionará.');
  epaycoClient = null;
}

/**
 * Maneja las confirmaciones de pago (webhook) enviadas por ePayco.
 */
const handleEpaycoWebhook = async (req, res) => {
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
        
        // El orderId lo enviamos en el campo extra1 desde el frontend
        const { x_cod_transaction_state, x_extra1: orderId } = charge.data;
        if (!orderId) {
            throw new Error(`El webhook para la transacción ${transactionId} no contiene un orderId (extra1).`);
        }
        
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
            'paymentDetails.transactionId': transactionId, // Guardamos la referencia de pago
            updatedAt: new Date().toISOString()
        });

        res.status(200).send('Webhook recibido y procesado.');

    } catch (error) {
        console.error(`Error en el webhook de ePayco para la transacción ${transactionId}:`, error);
        res.status(500).send('Error interno al procesar el webhook.');
    }
};


module.exports = {
    handleEpaycoWebhook
};