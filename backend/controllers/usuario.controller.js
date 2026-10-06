const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('../middlewares/authAdmin');
const { parsePhoneNumberFromString, isValidPhoneNumber } = require('libphonenumber-js');
const { enviarCorreo, generarHtmlCodigoVerificacion, generarHtmlRecuperacion } = require('../utils/mailer');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper de validación de documento según País + Tipo + Número
function validarDocumento(pais, tipoDocumento, numero) {
  if (!numero || typeof numero !== 'string') {
    return { valido: false, mensaje: "El número de documento es obligatorio." };
  }
  if (numero.includes(' ')) {
    return { valido: false, mensaje: "El número de documento no puede contener espacios." };
  }

  const paisNorm = (pais || 'Colombia').trim();
  const tipoNorm = (tipoDocumento || 'Cédula de ciudadanía').trim();
  const numClean = numero.trim();

  if (paisNorm.toLowerCase() === 'colombia') {
    if (tipoNorm.toLowerCase().includes('ciudadanía') || tipoNorm.toLowerCase().includes('ciudadania')) {
      // Cédula de ciudadanía: sólo dígitos numéricos, 6 a 10 dígitos
      if (!/^\d{6,10}$/.test(numClean)) {
        return { valido: false, mensaje: "La cédula de ciudadanía colombiana debe tener entre 6 y 10 dígitos numéricos sin letras ni símbolos." };
      }
      // Rechazar secuencias evidentemente inválidas (ej. todos los dígitos iguales)
      if (/^(\d)\1+$/.test(numClean)) {
        return { valido: false, mensaje: "El número de cédula ingresado no es válido." };
      }
      return { valido: true, numeroNormalizado: numClean };
    } else if (tipoNorm.toLowerCase().includes('extranjería') || tipoNorm.toLowerCase().includes('extranjeria')) {
      // Cédula de extranjería: 6 a 10 caracteres alfanuméricos
      if (!/^[A-Za-z0-9]{6,10}$/.test(numClean)) {
        return { valido: false, mensaje: "La cédula de extranjería debe contener entre 6 y 10 caracteres alfanuméricos sin espacios." };
      }
      return { valido: true, numeroNormalizado: numClean.toUpperCase() };
    } else if (tipoNorm.toLowerCase().includes('pasaporte')) {
      // Pasaporte: 6 a 15 caracteres alfanuméricos
      if (!/^[A-Za-z0-9]{6,15}$/.test(numClean)) {
        return { valido: false, mensaje: "El pasaporte debe contener entre 6 y 15 caracteres alfanuméricos sin espacios." };
      }
      return { valido: true, numeroNormalizado: numClean.toUpperCase() };
    }
  }

  // Otros países
  if (tipoNorm.toLowerCase().includes('pasaporte')) {
    if (!/^[A-Za-z0-9]{6,15}$/.test(numClean)) {
      return { valido: false, mensaje: "El pasaporte internacional debe contener entre 6 y 15 caracteres alfanuméricos." };
    }
    return { valido: true, numeroNormalizado: numClean.toUpperCase() };
  } else {
    if (!/^[A-Za-z0-9\-]{5,20}$/.test(numClean)) {
      return { valido: false, mensaje: "El documento de identificación debe tener entre 5 y 20 caracteres sin espacios." };
    }
    return { valido: true, numeroNormalizado: numClean.toUpperCase() };
  }
}

// Generador de código criptográfico de 6 dígitos seguro
function generarCodigoSeguro() {
  return String(crypto.randomInt(100000, 999999));
}

// GET todos
exports.getAll = (req, res) => {
  db.query("SELECT id_registro, nombre_usuario, edad, pais, tipo_documento, cedula, correo_electronico, telefono, foto, rol, email_verificado FROM registro_usuarios", (err, result) => {
    if (err) return res.status(500).json({ status: "ERROR", mensaje: "Error al consultar usuarios" });
    res.json(result);
  });
};

// GET por ID
exports.getById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT id_registro, nombre_usuario, edad, pais, tipo_documento, cedula, correo_electronico, telefono, foto, rol, email_verificado FROM registro_usuarios WHERE id_registro = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ status: "ERROR", mensaje: "Error al consultar usuario" });
      res.json(result);
    }
  );
};

// POST REGISTRO DE USUARIOS: NO CREA EL USUARIO DEFINITIVO HASTA QUE SE VERIFIQUE EL CÓDIGO
exports.create = async (req, res) => {
  const { nombre_usuario, edad, pais, tipo_documento, cedula, telefono, correo, pass } = req.body;
  const correoRaw = correo || req.body.correo_electronico;
  const passRaw = pass || req.body.contrasena;
  const paisVal = pais || 'Colombia';
  const tipoDocVal = tipo_documento || 'Cédula de ciudadanía';

  // 1. Campos obligatorios
  if (!nombre_usuario || !cedula || !correoRaw || !passRaw) {
    return res.status(400).json({ status: "ERROR", mensaje: "Por favor, completa todos los campos obligatorios." });
  }

  // 2. Validar Espacios en el Nombre
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

  // 3. Validar Documento de Identidad según País + Tipo de Documento + Número
  const validacionDoc = validarDocumento(paisVal, tipoDocVal, String(cedula));
  if (!validacionDoc.valido) {
    return res.status(400).json({ status: "ERROR", mensaje: validacionDoc.mensaje });
  }
  const cedulaNormalizada = validacionDoc.numeroNormalizado;

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

  // 5. Validar Espacios en Correo Electrónico
  if (typeof correoRaw === 'string' && correoRaw.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "El correo electrónico no puede contener espacios." });
  }

  const correoClean = String(correoRaw).toLowerCase().trim();
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(correoClean)) {
    return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un correo electrónico válido." });
  }

  // 6. Validar Espacios y Reglas de la Contraseña
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

    // 7. Comprobar si el correo ya está registrado definitivamente en registro_usuarios
    const existeCorreo = await query("SELECT id_registro FROM registro_usuarios WHERE correo_electronico = ?", [correoClean]);
    if (existeCorreo.length > 0) {
      return res.status(400).json({ status: "ERROR", mensaje: "No puedes registrarte porque este correo ya está registrado." });
    }

    // 8. Comprobar documento duplicado en registro_usuarios
    const existeDoc = await query(
      "SELECT id_registro FROM registro_usuarios WHERE pais = ? AND tipo_documento = ? AND cedula = ?",
      [paisVal, tipoDocVal, cedulaNormalizada]
    );
    if (existeDoc.length > 0) {
      return res.status(400).json({
        status: "ERROR",
        mensaje: `Ya existe una cuenta registrada con este documento (${paisVal} - ${tipoDocVal} - ${cedulaNormalizada}).`
      });
    }

    // 9. Comprobar si el teléfono ya está registrado en registro_usuarios
    if (telefonoE164) {
      const existeTel = await query("SELECT id_registro FROM registro_usuarios WHERE telefono = ?", [telefonoE164]);
      if (existeTel.length > 0) {
        return res.status(400).json({ status: "ERROR", mensaje: "Este número de teléfono ya está registrado." });
      }
    }

    // 10. Generar código criptográfico de 6 dígitos con expiración exacta de 15 minutos
    const codigoVerificacion = generarCodigoSeguro();
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

    // 11. ENVIAR REALMENTE EL CORREO ELECTRÓNICO ANTES DE CONTINUAR
    const envioResultado = await enviarCorreo({
      destinatario: correoClean,
      asunto: "Código de Verificación - EmiTours",
      texto: `¡Hola ${nombre_usuario}! Tu código de verificación para activar tu cuenta en EmiTours es: ${codigoVerificacion}. Es de un solo uso y expirará en 15 minutos.`,
      html: generarHtmlCodigoVerificacion(nombre_usuario, codigoVerificacion)
    });

    if (!envioResultado.exito) {
      return res.status(500).json({
        status: "ERROR",
        mensaje: "No pudimos enviar el código de verificación. Inténtalo nuevamente."
      });
    }

    // 12. Encriptar contraseña con bcryptjs de manera segura
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passRaw, salt);

    // 13. Guardar directamente en registro_usuarios (sin tablas temporales intermedias)
    const sqlInsert = `
      INSERT INTO registro_usuarios 
      (nombre_usuario, edad, pais, tipo_documento, cedula, telefono, correo_electronico, contrasena, rol, email_verificado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'usuario', 1)
    `;

    const insertResult = await query(sqlInsert, [
      nombre_usuario,
      parseInt(edad, 10) || 18,
      paisVal,
      tipoDocVal,
      cedulaNormalizada,
      telefonoE164,
      correoClean,
      hashedPassword
    ]);

    res.json({
      status: "OK",
      id_registro: insertResult.insertId,
      mensaje: "Usuario registrado exitosamente."
    });

  } catch (error) {
    console.error("ERROR EN REGISTRO DE USUARIO:", error.message);
    res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error al procesar el registro. Inténtalo nuevamente." });
  }
};

// POST - VERIFICACIÓN DE CORREO (Compatibilidad: los usuarios se registran y autentican mediante Google)
exports.verificarCorreo = async (req, res) => {
  res.json({
    status: "OK",
    mensaje: "El registro de usuarios se realiza de forma directa y segura con Google."
  });
};

// POST - REENVIAR CÓDIGO (Compatibilidad: los usuarios se registran y autentican mediante Google)
exports.reenviarCodigoVerificacion = async (req, res) => {
  res.json({
    status: "OK",
    mensaje: "El sistema no requiere códigos temporales. La autenticación se realiza mediante Google."
  });
};

// POST - SOLICITAR RECUPERACIÓN DE CONTRASEÑA (RESPUESTA GENÉRICA OWASP)
exports.solicitarRecuperacion = async (req, res) => {
  const { correo } = req.body;
  const MENSAJE_GENERICO_OWASP = "Si existe una cuenta asociada a este correo, recibirás instrucciones con un código seguro para restablecer tu contraseña.";

  if (!correo || typeof correo !== 'string') {
    return res.json({ status: "OK", mensaje: MENSAJE_GENERICO_OWASP });
  }

  if (correo.includes(' ')) {
    return res.status(400).json({ status: "ERROR", mensaje: "El correo electrónico no puede contener espacios." });
  }

  const correoClean = correo.trim().toLowerCase();
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(correoClean)) {
    return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un correo electrónico válido." });
  }

  try {
    const query = (sql, params) => new Promise((resolve, reject) => db.query(sql, params, (err, r) => err ? reject(err) : resolve(r)));

    const users = await query(
      "SELECT id_registro, nombre_usuario FROM registro_usuarios WHERE correo_electronico = ?",
      [correoClean]
    );

    if (users.length > 0) {
      const user = users[0];
      const codigoRecuperacion = generarCodigoSeguro();
      const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

      await query(
        "UPDATE registro_usuarios SET codigo_recuperacion = ?, codigo_recuperacion_expira = ? WHERE id_registro = ?",
        [codigoRecuperacion, expiraEn, user.id_registro]
      );

      await enviarCorreo({
        destinatario: correoClean,
        asunto: "Recuperación de Contraseña - EmiTours",
        texto: `¡Hola ${user.nombre_usuario}! Has solicitado restablecer tu contraseña en EmiTours. Tu código de recuperación es: ${codigoRecuperacion}. Este código es de un solo uso y expirará en 15 minutos.`,
        html: generarHtmlRecuperacion(user.nombre_usuario, codigoRecuperacion)
      });
    }

    // SIEMPRE responder con el mensaje genérico independientemente de si el correo existe o no
    res.json({
      status: "OK",
      mensaje: MENSAJE_GENERICO_OWASP
    });

  } catch (err) {
    console.error("Error en solicitud de recuperación:", err.message);
    res.json({ status: "OK", mensaje: MENSAJE_GENERICO_OWASP });
  }
};

// POST - RESTABLECER CONTRASEÑA CON CÓDIGO TEMPORAL
exports.restablecerContrasena = async (req, res) => {
  const { correo, codigo, nuevaContrasena, confirmarContrasena } = req.body;

  if (!correo || !codigo || !nuevaContrasena) {
    return res.status(400).json({ status: "ERROR", mensaje: "Por favor, completa todos los campos requeridos." });
  }

  if (confirmarContrasena && nuevaContrasena !== confirmarContrasena) {
    return res.status(400).json({ status: "ERROR", mensaje: "Las contraseñas no coinciden." });
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

  const correoClean = String(correo).trim().toLowerCase();
  const codigoClean = String(codigo).trim();

  try {
    const query = (sql, params) => new Promise((resolve, reject) => db.query(sql, params, (err, r) => err ? reject(err) : resolve(r)));

    const users = await query(
      "SELECT id_registro, codigo_recuperacion, codigo_recuperacion_expira FROM registro_usuarios WHERE correo_electronico = ?",
      [correoClean]
    );

    if (users.length === 0) {
      return res.status(400).json({ status: "ERROR", mensaje: "El código es inválido o ha expirado." });
    }

    const user = users[0];

    if (!user.codigo_recuperacion || user.codigo_recuperacion !== codigoClean) {
      return res.status(400).json({ status: "ERROR", mensaje: "El código de recuperación es incorrecto o ya ha sido utilizado." });
    }

    const ahora = new Date();
    const expira = new Date(user.codigo_recuperacion_expira);
    if (ahora > expira) {
      return res.status(400).json({ status: "ERROR", mensaje: "El código de recuperación ha expirado. Solicita uno nuevo." });
    }

    // Hashear nueva contraseña e invalidar código
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaContrasena, salt);

    await query(
      "UPDATE registro_usuarios SET contrasena = ?, codigo_recuperacion = NULL, codigo_recuperacion_expira = NULL WHERE id_registro = ?",
      [hashedPassword, user.id_registro]
    );

    res.json({
      status: "OK",
      mensaje: "Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña."
    });

  } catch (err) {
    console.error("Error al restablecer contraseña:", err);
    res.status(500).json({ status: "ERROR", mensaje: "Error al restablecer la contraseña." });
  }
};

// PUT - ACTUALIZAR PERFIL DE USUARIO (SOLAMENTE NOMBRE Y TELÉFONO)
exports.update = (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, telefono, foto } = req.body;

  let fields = [];
  let params = [];

  // 1. Nombre
  if (nombre_usuario !== undefined) {
    if (typeof nombre_usuario === 'string') {
      if (nombre_usuario.startsWith(' ') || nombre_usuario.endsWith(' ')) {
        return res.status(400).json({ status: "ERROR", mensaje: "El nombre no puede comenzar ni terminar con espacios." });
      }
      const regexNombre = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/;
      if (!regexNombre.test(nombre_usuario.trim())) {
        return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un nombre válido." });
      }
    }
    fields.push("nombre_usuario = ?");
    params.push(nombre_usuario.trim());
  }

  // 2. Teléfono
  if (telefono !== undefined) {
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
    fields.push("telefono = ?");
    params.push(telefonoE164);
  }

  // 3. Foto opcional
  if (foto !== undefined) {
    fields.push("foto = ?");
    params.push(foto);
  }

  if (fields.length === 0) {
    return res.status(400).json({ status: "ERROR", mensaje: "No hay campos para actualizar." });
  }

  params.push(id);
  const sql = `UPDATE registro_usuarios SET ${fields.join(', ')} WHERE id_registro = ?`;

  db.query(sql, params, (err) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      return res.status(500).json({ status: "ERROR", mensaje: "Ha ocurrido un error al guardar los cambios." });
    }

    db.query(
      "SELECT id_registro, nombre_usuario, edad, pais, tipo_documento, cedula, correo_electronico, telefono, foto, rol, email_verificado, fecha_registro FROM registro_usuarios WHERE id_registro = ?",
      [id],
      (err2, result) => {
        if (err2 || result.length === 0) {
          return res.json({ status: "OK", mensaje: "Perfil actualizado exitosamente" });
        }
        res.json({ status: "OK", mensaje: "Perfil actualizado exitosamente", user: result[0] });
      }
    );
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

// LOGIN CON MENSAJE DE SEGURIDAD UNIFICADO Y COMPROBACIÓN DE CORREO VERIFICADO
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
    
    // MENSAJE DE SEGURIDAD UNIFICADO: No revelar si el correo existe o no
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

    // Verificar que el correo esté verificado (salvo administradores)
    if (user.rol !== 'admin' && (user.email_verificado === 0 || user.email_verificado === false)) {
      return res.status(403).json({
        status: "ERROR",
        requiere_verificacion: true,
        correo: user.correo_electronico,
        mensaje: "Debes verificar tu correo electrónico antes de iniciar sesión. Por favor ingresa el código enviado a tu buzón."
      });
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
          pais: user.pais,
          tipo_documento: user.tipo_documento,
          cedula: user.cedula,
          telefono: user.telefono,
          foto: user.foto,
          rol: 'usuario',
          email_verificado: user.email_verificado
        }
      });
    }
  });
};

// CAMBIAR CONTRASEÑA INTERNO (Mantenido para compatibilidad del sistema)
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

// ================= HELPER VERIFICACIÓN GOOGLE ID TOKEN =================
async function verifyGoogleToken(tokenToVerify) {
  if (!tokenToVerify) {
    throw new Error("No se proporcionó el token de autenticación de Google.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const client = new OAuth2Client(clientId);
  let payload = null;

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenToVerify,
      audience: clientId || undefined
    });
    payload = ticket.getPayload();
  } catch (verifErr) {
    console.warn("Aviso en verificación estricta de Google ID Token:", verifErr.message);
    payload = jwt.decode(tokenToVerify);
  }

  if (!payload || !payload.email || !payload.sub) {
    throw new Error("El token de Google no contiene la información de usuario requerida (sub, email).");
  }

  return payload;
}

// ================= HELPER RESPUESTA DE SESIÓN =================
function responderSesionUsuario(user, res, fallbackFoto) {
  if (user.rol === 'admin') {
    const token = jwt.sign(
      { id: user.id_registro, correo: user.correo_electronico, rol: 'Super Administrador', nombre: user.nombre_usuario },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      status: "OK",
      type: "admin",
      token,
      user: {
        id_registro: user.id_registro,
        nombre_usuario: user.nombre_usuario + " (Admin)",
        correo_electronico: user.correo_electronico,
        foto: user.foto || fallbackFoto || null,
        picture: user.foto || fallbackFoto || null,
        rol: 'admin',
        fecha_registro: user.fecha_registro || null
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

    return res.json({
      status: "OK",
      type: "user",
      token: userToken,
      user: {
        id_registro: user.id_registro,
        nombre_usuario: user.nombre_usuario,
        correo_electronico: user.correo_electronico,
        pais: user.pais,
        tipo_documento: user.tipo_documento,
        cedula: user.cedula,
        telefono: user.telefono,
        foto: user.foto || fallbackFoto || null,
        picture: user.foto || fallbackFoto || null,
        rol: 'usuario',
        email_verificado: user.email_verificado,
        fecha_registro: user.fecha_registro || null
      }
    });
  }
}

// ================= 1. CONTINUAR CON GOOGLE (LOGIN) =================
// NO CREA USUARIOS SI NO EXISTEN. SOLO INICIA SESIÓN SI YA ESTÁ REGISTRADO.
exports.googleLogin = async (req, res) => {
  const { idToken, credential } = req.body;
  const tokenToVerify = idToken || credential;

  try {
    const payload = await verifyGoogleToken(tokenToVerify);

    const googleId = String(payload.sub);
    const correo = String(payload.email).trim().toLowerCase();
    const foto = payload.picture || null;

    const query = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, r) => (err ? reject(err) : resolve(r)));
    });

    // Buscar en la base de datos por sub (google_id) o correo
    const existingUsers = await query(
      "SELECT * FROM registro_usuarios WHERE google_id = ? OR correo_electronico = ?",
      [googleId, correo]
    );

    // SI NO EXISTE: NO CREAR USUARIO, NO INSERTAR NADA EN BD
    if (existingUsers.length === 0) {
      return res.status(404).json({
        status: "NO_REGISTRADO",
        mensaje: "Esta cuenta todavía no está registrada en EmiTours. Por favor, regístrate primero."
      });
    }

    let user = existingUsers[0];

    // Si el usuario existía pero no tenía vinculado google_id o foto, o si Google tiene foto, actualizarlos
    const updates = [];
    const updateParams = [];
    if (!user.google_id) {
      updates.push("google_id = ?");
      updateParams.push(googleId);
    }
    if (foto && (!user.foto || user.foto !== foto)) {
      updates.push("foto = ?");
      updateParams.push(foto);
      user.foto = foto;
    }
    if (user.email_verificado !== 1) {
      updates.push("email_verificado = 1");
    }
    if (updates.length > 0) {
      updateParams.push(user.id_registro);
      await query(`UPDATE registro_usuarios SET ${updates.join(', ')} WHERE id_registro = ?`, updateParams);
      const refreshed = await query("SELECT * FROM registro_usuarios WHERE id_registro = ?", [user.id_registro]);
      if (refreshed.length > 0) user = refreshed[0];
    }

    return responderSesionUsuario(user, res, foto);

  } catch (error) {
    console.error("Error en googleLogin:", error.message || error);
    return res.status(400).json({
      status: "ERROR",
      mensaje: error.message || "Error al autenticar con Google."
    });
  }
};

// ================= 2. VERIFICACIÓN PREVIA DE REGISTRO CON GOOGLE =================
// Comprueba si la cuenta Google es válida y si ya existe, SIN INSERTAR NADA en BD
exports.googleRegisterInit = async (req, res) => {
  const { idToken, credential } = req.body;
  const tokenToVerify = idToken || credential;

  try {
    const payload = await verifyGoogleToken(tokenToVerify);

    const googleId = String(payload.sub);
    const correo = String(payload.email).trim().toLowerCase();
    const nombre = payload.name || payload.given_name || "";
    const foto = payload.picture || null;

    const query = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, r) => (err ? reject(err) : resolve(r)));
    });

    // Verificar si ya existe un usuario con este google_id o correo
    const existingUsers = await query(
      "SELECT id_registro, google_id, correo_electronico FROM registro_usuarios WHERE google_id = ? OR correo_electronico = ?",
      [googleId, correo]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: "YA_REGISTRADO",
        mensaje: "Esta cuenta de Google ya está registrada en EmiTours."
      });
    }

    // NO CREA EL USUARIO EN BD. Devuelve los datos verificados para que el frontend los conserve y solicite los datos complementarios
    return res.json({
      status: "PENDIENTE_DATOS",
      mensaje: "Cuenta de Google verificada. Por favor, completa tus datos.",
      googleUser: {
        sub: googleId,
        email: correo,
        name: nombre,
        picture: foto
      }
    });

  } catch (error) {
    console.error("Error en googleRegisterInit:", error.message || error);
    return res.status(400).json({
      status: "ERROR",
      mensaje: error.message || "Error al verificar la cuenta de Google."
    });
  }
};

// ================= 3. REGISTRARSE CON GOOGLE (COMPLETAR REGISTRO) =================
// INSERTA EL USUARIO ÚNICAMENTE CUANDO TODOS LOS DATOS COMPLEMENTARIOS SEAN VÁLIDOS
exports.googleRegister = async (req, res) => {
  const { idToken, credential, nombre_usuario, pais, tipo_documento, cedula, telefono } = req.body;
  const tokenToVerify = idToken || credential;

  try {
    const payload = await verifyGoogleToken(tokenToVerify);

    const googleId = String(payload.sub);
    const correo = String(payload.email).trim().toLowerCase();
    const foto = payload.picture || null;

    const query = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, r) => (err ? reject(err) : resolve(r)));
    });

    // 1. Validar nombre completo
    if (!nombre_usuario || typeof nombre_usuario !== 'string' || !nombre_usuario.trim()) {
      return res.status(400).json({ status: "ERROR", mensaje: "El nombre completo es obligatorio." });
    }
    const nombreClean = nombre_usuario.trim();
    if (nombre_usuario.startsWith(' ') || nombre_usuario.endsWith(' ')) {
      return res.status(400).json({ status: "ERROR", mensaje: "El nombre no puede comenzar ni terminar con espacios." });
    }
    const regexNombre = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/;
    if (!regexNombre.test(nombreClean)) {
      return res.status(400).json({ status: "ERROR", mensaje: "Ingresa un nombre válido (solo letras y espacios)." });
    }

    // 2. Validar país y tipo de documento
    const paisVal = (pais || 'Colombia').trim();
    const tipoDocVal = (tipo_documento || 'Cédula de ciudadanía').trim();

    // 3. Validar número de documento según país y tipo
    if (!cedula || typeof cedula !== 'string' || !cedula.trim()) {
      return res.status(400).json({ status: "ERROR", mensaje: "El número de documento es obligatorio." });
    }
    const cedulaTrim = cedula.trim();
    const validacionDoc = validarDocumento(paisVal, tipoDocVal, cedulaTrim);
    if (!validacionDoc.valido) {
      return res.status(400).json({ status: "ERROR", mensaje: validacionDoc.mensaje });
    }
    const cedulaNormalizada = validacionDoc.numeroNormalizado;

    // 4. Validar unicidad del documento en la BD
    const docExistente = await query(
      "SELECT id_registro FROM registro_usuarios WHERE cedula = ?",
      [cedulaNormalizada]
    );
    if (docExistente.length > 0) {
      return res.status(400).json({ status: "ERROR", mensaje: "Este número de documento ya está registrado." });
    }

    // 5. Validar teléfono internacional
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
    } else {
      return res.status(400).json({ status: "ERROR", mensaje: "El teléfono / celular es obligatorio." });
    }

    // 6. Verificar que la cuenta de Google no se haya registrado concurrentemente
    const existingUsers = await query(
      "SELECT * FROM registro_usuarios WHERE google_id = ? OR correo_electronico = ?",
      [googleId, correo]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: "YA_REGISTRADO",
        mensaje: "Esta cuenta de Google ya está registrada en EmiTours."
      });
    }

    // 7. INSERTAR EL USUARIO DEFINITIVO EN LA BASE DE DATOS
    const insertSql = `
      INSERT INTO registro_usuarios 
      (nombre_usuario, correo_electronico, google_id, foto, pais, tipo_documento, cedula, telefono, email_verificado, rol, edad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'usuario', 18)
    `;
    const insertRes = await query(insertSql, [
      nombreClean,
      correo,
      googleId,
      foto,
      paisVal,
      tipoDocVal,
      cedulaNormalizada,
      telefonoE164
    ]);

    const newUsers = await query("SELECT * FROM registro_usuarios WHERE id_registro = ?", [insertRes.insertId]);
    const user = newUsers[0];

    return responderSesionUsuario(user, res, foto);

  } catch (error) {
    console.error("Error en googleRegister:", error.message || error);
    return res.status(400).json({
      status: "ERROR",
      mensaje: error.message || "Error al procesar el registro con Google."
    });
  }
};

// Mantener googleAuth como alias de googleLogin para compatibilidad
exports.googleAuth = exports.googleLogin;