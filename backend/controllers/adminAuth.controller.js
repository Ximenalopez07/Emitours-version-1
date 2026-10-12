const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authAdmin');

// Expresión regular estándar para formato de correo electrónico
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// LOGIN ADMINISTRADOR
exports.login = (req, res) => {
  const { correo, contrasena } = req.body;

  // 1. Validar presencia del correo electrónico
  if (correo === undefined || correo === null || typeof correo !== 'string' || correo.length === 0) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Ingresa tu correo electrónico' });
  }

  // 2. Prohibir espacios en cualquier posición (inicio, en medio o al final)
  if (/\s/.test(correo)) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'El correo electrónico no puede contener espacios' });
  }

  // 3. Validar formato de correo electrónico y longitud máxima
  if (!EMAIL_REGEX.test(correo) || correo.length > 150) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Ingresa un correo electrónico válido' });
  }

  // 4. Validar contraseña obligatoria
  if (contrasena === undefined || contrasena === null || typeof contrasena !== 'string' || contrasena.length === 0) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Ingresa tu contraseña' });
  }

  // 5. Prohibir espacios en la contraseña (inicio, en medio o al final)
  if (/\s/.test(contrasena)) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'La contraseña no puede contener espacios' });
  }

  // Limitar longitud máxima de contraseña recibida
  if (contrasena.length > 128) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'La contraseña excede la longitud máxima permitida.' });
  }

  const correoNormalizado = correo;

  // Mensaje genérico exacto requerido para credenciales incorrectas
  const genericAuthError = 'Correo electrónico o contraseña incorrectos';

  // 5. Consulta en la tabla registro_usuarios
  const sql = "SELECT id_registro, nombre_usuario, correo_electronico, contrasena, rol, foto, telefono FROM registro_usuarios WHERE correo_electronico = ?";
  
  db.query(sql, [correoNormalizado.toLowerCase()], async (err, result) => {
    if (err) {
      console.error('Error interno en autenticación administrativa:', err.message);
      return res.status(500).json({ status: 'ERROR', mensaje: 'Error interno en el servidor.' });
    }

    // Si el usuario no existe en la base de datos
    if (!result || result.length === 0) {
      return res.status(401).json({ status: 'ERROR', mensaje: genericAuthError });
    }

    const user = result[0];

    // Verificar permisos administrativos
    if (user.rol !== 'admin') {
      return res.status(403).json({ status: 'ERROR', mensaje: 'Acceso no autorizado' });
    }

    // 6. Comparación estricta y segura mediante bcrypt.compare
    try {
      const isMatch = await bcrypt.compare(contrasena, user.contrasena);
      if (!isMatch) {
        return res.status(401).json({ status: 'ERROR', mensaje: genericAuthError });
      }
    } catch (bcryptErr) {
      console.error('Error al comparar hash de contraseña:', bcryptErr.message);
      return res.status(401).json({ status: 'ERROR', mensaje: genericAuthError });
    }

    // 9. Construir payload y datos de sesión sin exponer datos sensibles ni hashes
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

    return res.json({
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
  db.query("SELECT id_registro, nombre_usuario, correo_electronico, telefono, foto FROM registro_usuarios WHERE id_registro = ? AND rol = 'admin'", [adminId], (err, result) => {
    if (err || !result || result.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'Administrador no encontrado o sin permisos.' });
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

// RECUPERAR CONTRASEÑA (Solicitud administrativa segura)
exports.forgotPassword = (req, res) => {
  const { correo } = req.body;
  if (!correo || typeof correo !== 'string') {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Debes proporcionar un correo electrónico.' });
  }
  const correoNormalizado = correo.trim().toLowerCase();
  db.query("SELECT id_registro FROM registro_usuarios WHERE correo_electronico = ? AND rol = 'admin'", [correoNormalizado], (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: 'Error al procesar la solicitud.' });
    // Respuesta genérica para no revelar si el correo administrativo existe
    res.json({ status: 'OK', mensaje: 'Si el correo corresponde a un administrador, recibirás las instrucciones correspondientes.' });
  });
};
