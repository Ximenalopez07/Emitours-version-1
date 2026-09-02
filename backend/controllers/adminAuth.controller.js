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

  const sql = "SELECT * FROM registro_usuarios WHERE correo_electronico = ? AND rol = 'admin'";
  db.query(sql, [correo], async (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    
    if (result.length === 0) {
      return res.status(401).json({ status: 'ERROR', mensaje: 'Credenciales administrativas inválidas o el usuario no tiene rol de administrador.' });
    }

    const user = result[0];
    const isMatch = (contrasena === user.contrasena) || (await bcrypt.compare(contrasena, user.contrasena).catch(() => false));
    if (!isMatch) {
      return res.status(401).json({ status: 'ERROR', mensaje: 'Credenciales administrativas inválidas.' });
    }

    const adminData = {
      id: user.id_registro,
      nombre: user.nombre_usuario,
      apellido: '',
      correo: user.correo_electronico,
      rol: 'Super Administrador',
      estado: 'Activo',
      foto: user.foto,
      telefono: user.telefono
    };

    const token = jwt.sign(
      { id: adminData.id, correo: adminData.correo, rol: adminData.rol, nombre: adminData.nombre },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      status: 'OK',
      mensaje: 'Inicio de sesión administrativo exitoso',
      token,
      admin: adminData
    });
  });
};

// VERIFICAR SESIÓN ADMIN
exports.verifySession = (req, res) => {
  const adminId = req.admin.id;
  db.query("SELECT id_registro, nombre_usuario, correo_electronico, telefono, foto FROM registro_usuarios WHERE id_registro = ?", [adminId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'Administrador no encontrado' });
    }
    const u = result[0];
    res.json({
      status: 'OK',
      admin: {
        id: u.id_registro,
        nombre: u.nombre_usuario,
        apellido: '',
        correo: u.correo_electronico,
        telefono: u.telefono,
        rol: 'Super Administrador',
        estado: 'Activo',
        foto: u.foto
      }
    });
  });
};

// RECUPERAR CONTRASEÑA (Solicitud / Simulación segura)
exports.forgotPassword = (req, res) => {
  const { correo } = req.body;
  db.query("SELECT id_registro FROM registro_usuarios WHERE correo_electronico = ? AND rol = 'admin'", [correo], (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.message });
    if (result.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'No existe ningún administrador registrado con este correo.' });
    }
    res.json({ status: 'OK', mensaje: 'Se ha enviado una clave temporal a tu correo electrónico registrado.' });
  });
};

