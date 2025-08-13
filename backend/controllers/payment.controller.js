// backend/controllers/payment.controller.js
// Lógica de negocio para interactuar con la pasarela de pagos ePayco.
// VERSIÓN ROBUSTA 2.0: Maneja casos donde el método de pago es indefinido.

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
        
        if (!charge.success || !charge.data) {
            throw new Error(`ePayco no pudo obtener los datos de la transacción ${transactionId}`);
        }
        
        const { x_cod_transaction_state, x_extra1: orderId } = charge.data;
        if (!orderId) {
            throw new Error(`El webhook para la transacción ${transactionId} no contiene un orderId (extra1).`);
        }
        
        const orderRef = db.collection('orders').doc(orderId);

        let newStatus;
        // ePayco envía el código como un string
        switch (String(x_cod_transaction_state)) {
            case "1": // Aceptada
                newStatus = 'paid';
                break;
            case "2": // Rechazada
            case "4": // Fallida
                newStatus = 'cancelled';
                break;
            case "3": // Pendiente
                newStatus = 'awaiting_payment';
                break;
            default:
                // Si llega un código desconocido, lo dejamos pendiente para revisión manual.
                console.warn(`Webhook con código de estado desconocido: ${x_cod_transaction_state}`);
                newStatus = 'awaiting_payment';
                break;
        }

        // --- LÍNEA CORREGIDA ---
        // Añadimos un valor por defecto para 'paymentMethod' si no viene en la respuesta.
        const updatePayload = {
            status: newStatus,
            'paymentDetails.paymentMethod': charge.data.x_type_payment || 'No especificado',
            'paymentDetails.transactionId': transactionId,
            updatedAt: new Date().toISOString()
        };

        await orderRef.update(updatePayload);

        res.status(200).send('Webhook recibido y procesado.');

    } catch (error) {
        console.error(`Error en el webhook de ePayco para la transacción ${transactionId}:`, error);
        res.status(500).send('Error interno al procesar el webhook.');
    }
};


module.exports = {
    handleEpaycoWebhook
};