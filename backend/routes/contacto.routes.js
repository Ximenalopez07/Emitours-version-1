const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contacto.controller');

// Ruta pública para enviar mensaje de contacto
router.post('/', contactoController.createMensaje);

// Rutas de administración
router.get('/admin', contactoController.getMensajesAdmin);
router.put('/admin/:id/responder', contactoController.responderMensajeAdmin);

module.exports = router;
