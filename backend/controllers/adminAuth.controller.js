const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authAdmin');

// LOGIN ADMINISTRADOR
exports.login = (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Debes proporcionar correo y contraseña.' });
  }

  const sql = "SELECT * FROM administradores WHERE correo = ?";
  db.query(sql, [correo], async (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    
    if (result.length === 0) {
      return res.status(401).json({ status: 'ERROR', mensaje: 'Credenciales administrativas inválidas.' });
    }

    const admin = result[0];

    if (admin.estado !== 'Activo') {
      return res.status(403).json({ status: 'ERROR', mensaje: 'Tu cuenta administrativa está desactivada. Contacta al Super Administrador.' });
    }

    const isMatch = await bcrypt.compare(contrasena, admin.contrasena);
    if (!isMatch) {
      return res.status(401).json({ status: 'ERROR', mensaje: 'Credenciales administrativas inválidas.' });
    }

    const token = jwt.sign(
      { id: admin.id, correo: admin.correo, rol: admin.rol, nombre: admin.nombre },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Quitar la contraseña de la respuesta
    delete admin.contrasena;

    res.json({
      status: 'OK',
      mensaje: 'Inicio de sesión administrativo exitoso',
      token,
      admin
    });
  });
};

// VERIFICAR SESIÓN ADMIN
exports.verifySession = (req, res) => {
  const adminId = req.admin.id;
  db.query("SELECT id, nombre, apellido, documento, correo, telefono, rol, estado, foto, fecha_creacion FROM administradores WHERE id = ?", [adminId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'Administrador no encontrado' });
    }
    res.json({ status: 'OK', admin: result[0] });
  });
};

// RECUPERAR CONTRASEÑA (Solicitud / Simulación segura)
exports.forgotPassword = (req, res) => {
  const { correo } = req.body;
  db.query("SELECT id FROM administradores WHERE correo = ?", [correo], (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.message });
    if (result.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'No existe ningún administrador registrado con este correo.' });
    }
    res.json({ status: 'OK', mensaje: 'Se ha enviado una clave temporal a tu correo electrónico registrado.' });
  });
};
