const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'emitours_admin_secret_key_2026';

// Middleware para verificar Token JWT de Administrador
exports.verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ status: 'ERROR', mensaje: 'Acceso denegado. No se proporcionó token de autenticación.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ status: 'ERROR', mensaje: 'Token inválido o expirado.' });
  }
};

// Middleware para verificar rol de Super Administrador
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.rol !== 'Super Administrador') {
    return res.status(403).json({ status: 'ERROR', mensaje: 'Permiso denegado. Se requiere rol de Super Administrador.' });
  }
  next();
};

exports.JWT_SECRET = JWT_SECRET;
