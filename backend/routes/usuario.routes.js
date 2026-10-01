const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Middleware de Rate Limiting en memoria contra ataques de fuerza bruta
const loginAttempts = new Map();

const rateLimitLogin = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutos
  const MAX_ATTEMPTS = 5;

  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
  } else {
    record.count += 1;
  }

  loginAttempts.set(ip, record);

  if (record.count > MAX_ATTEMPTS) {
    return res.status(429).json({
      status: "ERROR",
      mensaje: "Has realizado demasiados intentos. Espera unos minutos e inténtalo nuevamente."
    });
  }

  next();
};

// ================= LOGIN Y AUTENTICACIÓN GOOGLE =================
router.post('/login', rateLimitLogin, usuarioController.login);
router.post('/google-login', usuarioController.googleLogin);
router.post('/google-register-init', usuarioController.googleRegisterInit);
router.post('/google-register', usuarioController.googleRegister);
router.post('/google-auth', usuarioController.googleLogin);

// ================= VERIFICACIÓN DE CORREO =================
router.post('/verificar-correo', usuarioController.verificarCorreo);
router.post('/reenviar-codigo', usuarioController.reenviarCodigoVerificacion);

// ================= RECUPERACIÓN DE CONTRASEÑA =================
router.post('/solicitar-recuperacion', rateLimitLogin, usuarioController.solicitarRecuperacion);
router.post('/restablecer-contrasena', usuarioController.restablecerContrasena);

// ================= CRUD =================
router.get('/', usuarioController.getAll);
router.get('/:id', usuarioController.getById);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);
router.put('/:id/password', usuarioController.changePassword);
router.delete('/:id', usuarioController.delete);

module.exports = router;