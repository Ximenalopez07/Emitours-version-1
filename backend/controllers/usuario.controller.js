const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authAdmin');
const { parsePhoneNumberFromString, isValidPhoneNumber } = require('libphonenumber-js');

// GET todos
exports.getAll = (req, res) => {
  db.query("SELECT id_registro, nombre_usuario, edad, sexo, cedula, correo_electronico, telefono, foto, rol FROM registro_usuarios", (err, result) => {
    if (err) return res.status(500).json({ status: "ERROR", mensaje: "Error al consultar usuarios" });
    res.json(result);
  });
};

// GET por ID
exports.getById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT id_registro, nombre_usuario, edad, sexo, cedula, correo_electronico, telefono, foto, rol FROM registro_usuarios WHERE id_registro = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ status: "ERROR", mensaje: "Error al consultar usuario" });
      res.json(result);
    }
  );
};

// POST REGISTRO DE USUARIOS CON LIBPHONENUMBER-JS Y FORMATO INTERNACIONAL E.164
exports.create = async (req, res) => {
  console.log("RECIBIDA PETICIÓN DE REGISTRO:", req.body);
  const { nombre_usuario, edad, sexo, cedula, telefono, correo, pass } = req.body;
  const correoRaw = correo || req.body.correo_electronico;
  const passRaw = pass || req.body.contrasena;

  // 1. Campos obligatorios
  if (!nombre_usuario || !cedula || !correoRaw || !passRaw) {
    return res.status(400).json({ status: "ERROR", mensaje: "Por favor, completa todos los campos." });
  }

  // 2. Validar Espacios en el Nombre (RECHAZAR, NO AUTO-TRIM)
  if (typeof nombre_usuario === 'string') {
    if (nombre_usuario.startsWith(' ') && nombre_usuario.endsWith(' ')) {
      return res.status(400).json({ status: "ERROR", mensaje: "El nombre no puede comenzar ni terminar con espacios." });
    }
    if (nombre_usuario.startsWith(' ')) {
      return res.status(400).json({ status: "ERROR", mensaje: "El nombre no puede comenzar con espacios." });
    }
    if (nombre_usuario.endsWith(' ')) {
      return res.status(400).json({ status: "ERROR", mensaje: "El nombre no puede terminar con espacios." });
    }
  }

  // Validar caracteres en Nombre
  const regexNombre = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/;
  if (!regexNombre.test(nombre_usuario)) {
    return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un nombre válido." });
  }

  // 3. Validar Cédula (sólo dígitos, 5-12 caracteres)
  const cedulaTrimmed = String(cedula).trim();
  const regexCedula = /^[0-9]{5,12}$/;
  if (!regexCedula.test(cedulaTrimmed)) {
    return res.status(400).json({ status: "ERROR", mensaje: "El número de documento debe contener únicamente números." });
  }

  // 4. Validar Teléfono Internacional con libphonenumber-js y normalizar a E.164
  let telefonoE164 = null;
  if (telefono && typeof telefono === 'string' && telefono.trim() !== '') {
    const rawTel = telefono.trim();
    try {
      let parsed = parsePhoneNumberFromString(rawTel.startsWith('+') ? rawTel : `+${rawTel}`);
      if (!parsed || !parsed.isValid()) {
        parsed = parsePhoneNumberFromString(rawTel, 'CO');
      }

      if (parsed && parsed.isValid()) {
        telefonoE164 = parsed.format('E.164');
      } else {
        return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un número de teléfono válido." });
      }
    } catch (e) {
      return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un número de teléfono válido." });
    }
  }

  // 5. Validar Espacios en Correo Electrónico (RECHAZAR CUALQUIER ESPACIO)
  if (typeof correoRaw === 'string' && correoRaw.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "El correo electrónico no puede contener espacios." });
  }

  const correoClean = String(correoRaw).toLowerCase();
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(correoClean)) {
    return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un correo electrónico válido." });
  }

  // 6. Validar Espacios y Reglas de la Contraseña (RECHAZAR CUALQUIER ESPACIO)
  if (typeof passRaw === 'string' && passRaw.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "La contraseña no puede contener espacios." });
  }

  const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passRaw || !regexPass.test(passRaw)) {
    return res.status(400).json({
      status: "ERROR",
      mensaje: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
    });
  }

  try {
    const query = (sql, params) => new Promise((resolve, reject) => db.query(sql, params, (err, r) => err ? reject(err) : resolve(r)));

    // 7. Comprobar si el correo ya está registrado
    const existeCorreo = await query("SELECT id_registro FROM registro_usuarios WHERE correo_electronico = ?", [correoClean]);
    if (existeCorreo.length > 0) {
      return res.status(400).json({ status: "ERROR", mensaje: "No puedes registrarte porque este correo ya está registrado." });
    }

    // 8. Comprobar si la cédula ya está registrada
    const existeCedula = await query("SELECT id_registro FROM registro_usuarios WHERE cedula = ?", [cedulaTrimmed]);
    if (existeCedula.length > 0) {
      return res.status(400).json({ status: "ERROR", mensaje: "Este número de documento ya está registrado." });
    }

    // 9. Comprobar si el teléfono E.164 ya está registrado (si se proporciona)
    if (telefonoE164) {
      const existeTel = await query("SELECT id_registro FROM registro_usuarios WHERE telefono = ?", [telefonoE164]);
      if (existeTel.length > 0) {
        return res.status(400).json({ status: "ERROR", mensaje: "Este número de teléfono ya está registrado." });
      }
    }

    // 10. Encriptar contraseña con bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passRaw, salt);

    // 11. Guardar usuario en la base de datos en formato E.164
    const sqlInsert = `
      INSERT INTO registro_usuarios 
      (nombre_usuario, edad, sexo, cedula, telefono, correo_electronico, contrasena, rol)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'usuario')
    `;

    await query(sqlInsert, [
      nombre_usuario,
      parseInt(edad, 10) || 18,
      sexo || 'Otro',
      cedulaTrimmed,
      telefonoE164,
      correoClean,
      hashedPassword
    ]);

    res.json({
      status: "OK",
      mensaje: "¡Registro exitoso! Ahora puedes iniciar sesión."
    });

  } catch (error) {
    console.error("ERROR EN REGISTRO DE USUARIO:", error);
    res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error. Inténtalo nuevamente." });
  }
};

// PUT - ACTUALIZAR PERFIL DE USUARIO CON VALIDACIÓN Y NORMALIZACIÓN DE TELÉFONO E.164
exports.update = (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, edad, sexo, correo, telefono, foto } = req.body;
  const correoRaw = correo || req.body.correo_electronico || '';

  if (typeof correoRaw === 'string' && correoRaw.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "El correo electrónico no puede contener espacios." });
  }

  const correo_electronico = String(correoRaw).toLowerCase();

  // Validar teléfono con libphonenumber-js si viene en la solicitud
  let telefonoE164 = telefono;
  if (telefono && typeof telefono === 'string' && telefono.trim() !== '') {
    const rawTel = telefono.trim();
    try {
      let parsed = parsePhoneNumberFromString(rawTel.startsWith('+') ? rawTel : `+${rawTel}`);
      if (!parsed || !parsed.isValid()) {
        parsed = parsePhoneNumberFromString(rawTel, 'CO');
      }
      if (parsed && parsed.isValid()) {
        telefonoE164 = parsed.format('E.164');
      } else {
        return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un número de teléfono válido." });
      }
    } catch (e) {
      return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un número de teléfono válido." });
    }
  }

  const sql = `
    UPDATE registro_usuarios 
    SET nombre_usuario=?, edad=?, sexo=?, correo_electronico=?, telefono=?, foto=?
    WHERE id_registro=?
  `;

  db.query(sql, [nombre_usuario, edad, sexo, correo_electronico, telefonoE164, foto, id], (err) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      return res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error. Inténtalo nuevamente." });
    }
    
    db.query("SELECT id_registro, nombre_usuario, edad, sexo, cedula, correo_electronico, telefono, foto, rol FROM registro_usuarios WHERE id_registro = ?", [id], (err2, result) => {
      if (err2 || result.length === 0) {
        return res.json({ status: "OK", mensaje: "Usuario actualizado" });
      }
      res.json({ status: "OK", mensaje: "Usuario actualizado", user: result[0] });
    });
  });
};

// DELETE - ELIMINAR CUENTA DE USUARIO
exports.delete = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM reservas WHERE usuario_id = ?", [id], (errReservas) => {
    if (errReservas) {
      console.error("Error al eliminar reservas del usuario:", errReservas);
      return res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error. Inténtalo nuevamente." });
    }

    db.query("DELETE FROM registro_usuarios WHERE id_registro = ?", [id], (err) => {
      if (err) {
        console.error("Error al eliminar usuario:", err);
        return res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error. Inténtalo nuevamente." });
      }
      res.json({ status: "OK", mensaje: "Usuario eliminado exitosamente" });
    });
  });
};

// LOGIN CON MENSAJE DE SEGURIDAD UNIFICADO Y RECHAZO DE ESPACIOS EN CORREO Y CONTRASEÑA
exports.login = (req, res) => {
  console.log("RECIBIDA PETICIÓN DE LOGIN:", req.body);
  const { correo, pass } = req.body;
  const correoRaw = correo || req.body.correo_electronico;
  const passRaw = pass || req.body.contrasena;

  // 1. Validaciones de presencia
  if (!correoRaw && !passRaw) {
    return res.status(400).json({ status: "ERROR", mensaje: "Por favor, completa todos los campos." });
  }
  if (!correoRaw) {
    return res.status(400).json({ status: "ERROR", mensaje: "El correo electrónico es obligatorio." });
  }
  if (!passRaw) {
    return res.status(400).json({ status: "ERROR", mensaje: "La contraseña es obligatoria." });
  }

  // 2. Validar espacios en Correo Electrónico en Login
  if (typeof correoRaw === 'string' && correoRaw.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "El correo electrónico no puede contener espacios." });
  }

  // 3. Validar espacios en Contraseña en Login
  if (typeof passRaw === 'string' && passRaw.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "La contraseña no puede contener espacios." });
  }

  // 4. Validar formato de correo
  const correoClean = String(correoRaw).toLowerCase();
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(correoClean)) {
    return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un correo electrónico válido." });
  }

  const sql = "SELECT * FROM registro_usuarios WHERE correo_electronico = ?";
  db.query(sql, [correoClean], async (err, result) => {
    if (err) {
      console.error("Error en consulta de login:", err);
      return res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error. Inténtalo nuevamente." });
    }
    
    // MENSAJE DE SEGURIDAD UNIFICADO
    if (result.length === 0) {
      return res.status(401).json({ status: "ERROR", mensaje: "El correo electrónico o la contraseña son incorrectos." });
    }

    const user = result[0];

    // Verificar contraseña con bcrypt
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(passRaw, user.contrasena);
    } catch (e) {
      isMatch = false;
    }

    if (!isMatch && user.contrasena === passRaw) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ status: "ERROR", mensaje: "El correo electrónico o la contraseña son incorrectos." });
    }

    // Generar JWT según el rol real registrado en la base de datos
    if (user.rol === 'admin') {
      const token = jwt.sign(
        { id: user.id_registro, correo: user.correo_electronico, rol: 'Super Administrador', nombre: user.nombre_usuario },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.json({
        status: "OK",
        type: "admin",
        token,
        user: {
          id_registro: user.id_registro,
          nombre_usuario: user.nombre_usuario + " (Admin)",
          correo_electronico: user.correo_electronico,
          foto: user.foto,
          rol: 'admin'
        },
        admin: {
          id: user.id_registro,
          nombre: user.nombre_usuario,
          correo: user.correo_electronico,
          rol: 'Super Administrador',
          estado: 'Activo'
        }
      });
    } else {
      const userToken = jwt.sign(
        { id: user.id_registro, id_registro: user.id_registro, correo: user.correo_electronico, nombre: user.nombre_usuario },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({
        status: "OK",
        type: "user",
        token: userToken,
        user: {
          id_registro: user.id_registro,
          nombre_usuario: user.nombre_usuario,
          correo_electronico: user.correo_electronico,
          cedula: user.cedula,
          telefono: user.telefono,
          foto: user.foto,
          rol: 'usuario'
        }
      });
    }
  });
};

// CAMBIAR CONTRASEÑA CON HASH DE BCRYPT Y RECHAZO DE ESPACIOS
exports.changePassword = async (req, res) => {
  const { id } = req.params;
  const { contrasenaActual, nuevaContrasena } = req.body;

  if (!contrasenaActual || !nuevaContrasena) {
    return res.status(400).json({ status: "ERROR", mensaje: "Debe proporcionar la contraseña actual y la nueva." });
  }

  if (typeof nuevaContrasena === 'string' && nuevaContrasena.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "La contraseña no puede contener espacios." });
  }

  const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!regexPass.test(nuevaContrasena)) {
    return res.status(400).json({
      status: "ERROR",
      mensaje: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
    });
  }

  db.query("SELECT contrasena FROM registro_usuarios WHERE id_registro = ?", [id], async (err, result) => {
    if (err) return res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error. Inténtalo nuevamente." });
    if (result.length === 0) return res.status(404).json({ status: "ERROR", mensaje: "Usuario no encontrado" });

    const userPass = result[0].contrasena;
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(contrasenaActual, userPass);
    } catch (e) {
      isMatch = false;
    }
    if (!isMatch && userPass === contrasenaActual) isMatch = true;

    if (!isMatch) {
      return res.status(400).json({ status: "ERROR", mensaje: "La contraseña actual es incorrecta" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNew = await bcrypt.hash(nuevaContrasena, salt);

    db.query("UPDATE registro_usuarios SET contrasena = ? WHERE id_registro = ?", [hashedNew, id], (err2) => {
      if (err2) return res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error. Inténtalo nuevamente." });
      res.json({ status: "OK", mensaje: "Contraseña actualizada exitosamente" });
    });
  });
};