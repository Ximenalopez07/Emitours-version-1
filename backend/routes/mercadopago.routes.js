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

// 🔹 POST Webhook / Notificaciones automáticas IPN de Mercado Pago
router.post('/webhook', mpController.procesarWebhook);
router.post('/notificaciones', mpController.procesarWebhook);

module.exports = router;

