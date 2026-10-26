const express = require('express');
const router = express.Router();
const mpController = require('../controllers/mercadopago.controller');

// 🔹 GET configuración pública (Public Key para el frontend)
router.get('/config', mpController.getConfigPublica);

// 🔹 POST crear preferencia de Checkout Pro
router.post('/crear-preferencia', mpController.crearPreferencia);

// 🔹 GET verificar estado de pago en Mercado Pago por ID
router.get('/verificar/:paymentId', mpController.verificarPago);
router.get('/verificar-pago/:paymentId', mpController.verificarPago);

// 🔹 GET obtener último pago en Sandbox (recuperación automática para localhost)
router.get('/ultimo-pago', mpController.obtenerUltimoPago);

// 🔹 Webhook / Notificaciones automáticas IPN de Mercado Pago
// Admite POST (para notificaciones reales de la API) y GET (para comprobación de estado y pruebas de conectividad)
router.post('/webhook', mpController.procesarWebhook);
router.get('/webhook', mpController.estadoWebhook);
router.post('/notificaciones', mpController.procesarWebhook);
router.get('/notificaciones', mpController.estadoWebhook);

module.exports = router;

