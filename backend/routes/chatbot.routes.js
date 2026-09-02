const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const chatbotController = require('../controllers/chatbot.controller');
const { JWT_SECRET } = require('../middlewares/authAdmin');

// Middleware para verificar token de usuario autenticado
const verifyUserToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ status: 'ERROR', mensaje: 'Para utilizar nuestro asistente virtual debes registrarte e iniciar sesión.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'ERROR', mensaje: 'Para utilizar nuestro asistente virtual debes registrarte e iniciar sesión.' });
  }
};

// Ruta protegida para que el usuario converse con la IA
router.post('/message', verifyUserToken, chatbotController.procesarMensaje);

// Rutas de administración
router.get('/admin/history', chatbotController.getHistorialAdmin);
router.get('/admin/config', chatbotController.getConfigAdmin);
router.put('/admin/config', chatbotController.updateConfigAdmin);

module.exports = router;
