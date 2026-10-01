const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ================= GESTIÓN DE USUARIOS (CLIENTES) =================
exports.getUsuarios = (req, res) => {
  db.query(
    "SELECT id_registro, nombre_usuario, edad, sexo, cedula, correo_electronico, telefono, foto, rol, 'Activo' as estado, CURRENT_TIMESTAMP as fecha_registro FROM registro_usuarios WHERE rol != 'admin' OR rol IS NULL ORDER BY id_registro DESC",
    (err, result) => {
      if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
      res.json(result);
    }
  );
};

exports.updateUsuarioAdmin = (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, edad, sexo, cedula, correo_electronico, telefono, foto } = req.body;
  const sql = "UPDATE registro_usuarios SET nombre_usuario=?, edad=?, sexo=?, cedula=?, correo_electronico=?, telefono=?, foto=? WHERE id_registro=?";
  db.query(sql, [nombre_usuario, edad || 18, sexo || 'Otro', cedula, correo_electronico, telefono, foto, id], (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Usuario actualizado correctamente por el administrador" });
  });
};

exports.deleteUsuarioAdmin = (req, res) => {
  const { id } = req.params;

  // 1. Proteger cuentas con rol admin para evitar autoeliminación o eliminación de administradores
  db.query("SELECT rol FROM registro_usuarios WHERE id_registro = ?", [id], (errCheck, resultCheck) => {
    if (errCheck) return res.status(500).json({ status: 'ERROR', mensaje: errCheck.sqlMessage || errCheck.message });
    if (resultCheck.length === 0) return res.status(404).json({ status: 'ERROR', mensaje: 'Usuario no encontrado' });

    if (resultCheck[0].rol === 'admin') {
      return res.status(403).json({ status: 'ERROR', mensaje: 'No es permitido eliminar una cuenta de Administrador desde este panel.' });
    }

    // 2. Eliminar reservas asociadas al usuario para preservar integridad referencial
    db.query("DELETE FROM reservas WHERE usuario_id = ?", [id], (errRes) => {
      if (errRes) return res.status(500).json({ status: 'ERROR', mensaje: errRes.sqlMessage || errRes.message });

      // 3. Eliminar el usuario
      db.query("DELETE FROM registro_usuarios WHERE id_registro = ?", [id], (errDel) => {
        if (errDel) return res.status(500).json({ status: 'ERROR', mensaje: errDel.sqlMessage || errDel.message });
        res.json({ status: 'OK', mensaje: 'Usuario eliminado correctamente' });
      });
    });
  });
};

// ================= GESTIÓN DE ADMINISTRADORES =================
exports.getAdministradores = (req, res) => {
  db.query("SELECT id_registro as id, nombre_usuario as nombre, '' as apellido, cedula as documento, correo_electronico as correo, telefono, rol, 'Activo' as estado, foto, CURRENT_TIMESTAMP as fecha_creacion FROM registro_usuarios WHERE rol = 'admin' ORDER BY id_registro DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.createAdministrador = async (req, res) => {
  const { nombre, correo, contrasena, telefono, cedula } = req.body;
  try {
    const sql = "INSERT INTO registro_usuarios (nombre_usuario, edad, sexo, cedula, correo_electronico, contrasena, telefono, rol) VALUES (?, 30, 'Otro', ?, ?, ?, ?, 'admin')";
    db.query(sql, [nombre, cedula || String(Date.now()), correo, contrasena || 'Admin123*', telefono], (err, result) => {
      if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
      res.json({ status: 'OK', mensaje: "Administrador creado exitosamente", id: result.insertId });
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', mensaje: err.message });
  }
};

exports.updateAdministrador = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, telefono, contrasena } = req.body;
  try {
    if (contrasena && contrasena.trim() !== '') {
      const sql = "UPDATE registro_usuarios SET nombre_usuario=?, correo_electronico=?, telefono=?, contrasena=? WHERE id_registro=? AND rol='admin'";
      db.query(sql, [nombre, correo, telefono, contrasena, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Administrador actualizado con nueva contraseña" });
      });
    } else {
      const sql = "UPDATE registro_usuarios SET nombre_usuario=?, correo_electronico=?, telefono=? WHERE id_registro=? AND rol='admin'";
      db.query(sql, [nombre, correo, telefono, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Administrador actualizado" });
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.deleteAdministrador = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE registro_usuarios SET rol = 'usuario' WHERE id_registro = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Administrador removido de su rol" });
  });
};

// ================= GESTIÓN DE LUGARES TURÍSTICOS =================
exports.getLugaresAdmin = (req, res) => {
  const sql = "SELECT id, nombre, descripcion, imagen FROM lugares ORDER BY id DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json(result);
  });
};

exports.createLugarAdmin = (req, res) => {
  const { nombre, descripcion, imagen } = req.body;
  if (!nombre || !descripcion) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'El nombre y la descripción son obligatorios.' });
  }
  const sql = "INSERT INTO lugares (nombre, descripcion, imagen) VALUES (?, ?, ?)";
  db.query(sql, [nombre, descripcion, imagen || ''], (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Lugar creado exitosamente", id: result.insertId });
  });
};

exports.updateLugarAdmin = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen } = req.body;
  const sql = "UPDATE lugares SET nombre=?, descripcion=?, imagen=? WHERE id=?";
  db.query(sql, [nombre, descripcion, imagen, id], (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Lugar actualizado exitosamente" });
  });
};

exports.deleteLugarAdmin = (req, res) => {
  const { id } = req.params;
  // Eliminar o desvincular reservas relacionadas con el lugar
  db.query("DELETE FROM reservas WHERE lugar_id = ?", [id], (errRes) => {
    if (errRes) return res.status(500).json({ status: 'ERROR', mensaje: errRes.sqlMessage || errRes.message });

    db.query("DELETE FROM lugares WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
      res.json({ status: 'OK', mensaje: "Lugar eliminado exitosamente" });
    });
  });
};

// ================= GESTIÓN DE GUÍAS TURÍSTICOS =================
exports.getGuiasAdmin = (req, res) => {
  const sql = "SELECT id, nombre, apellido, telefono, correo, idioma, foto FROM guias ORDER BY id DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json(result);
  });
};

exports.createGuiaAdmin = (req, res) => {
  const { nombre, apellido, telefono, correo, idioma, foto } = req.body;
  if (!nombre || !apellido || !correo) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Nombre, apellido y correo son obligatorios.' });
  }

  const sql = "INSERT INTO guias (nombre, apellido, telefono, correo, idioma, foto) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [nombre, apellido, telefono || '', correo, idioma || 'Español', foto || ''], (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Guía turístico agregado exitosamente", id: result.insertId });
  });
};

exports.updateGuiaAdmin = (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, telefono, correo, idioma, foto } = req.body;

  const sql = "UPDATE guias SET nombre=?, apellido=?, telefono=?, correo=?, idioma=?, foto=? WHERE id=?";
  db.query(sql, [nombre, apellido, telefono, correo, idioma, foto, id], (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Información del guía actualizada correctamente" });
  });
};

exports.deleteGuiaAdmin = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM guias WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Guía eliminado exitosamente" });
  });
};

// ================= GESTIÓN DE RESERVAS =================
exports.getReservasAdmin = (req, res) => {
  const sql = `
    SELECT 
      r.id,
      r.usuario_id,
      r.lugar_id,
      r.fecha,
      r.hora,
      r.numero_personas,
      r.idioma,
      r.precio_total,
      r.metodo_pago,
      r.estado_pago,
      r.estado,
      r.codigo,
      r.fecha_creacion,
      u.nombre_usuario,
      u.correo_electronico,
      u.telefono,
      l.nombre as lugar_nombre,
      l.imagen as lugar_imagen
    FROM reservas r
    LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
    LEFT JOIN lugares l ON r.lugar_id = l.id
    ORDER BY r.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json(result);
  });
};

exports.updateReservaStatus = (req, res) => {
  const { id } = req.params;
  const { estado, estado_pago } = req.body;
  let estadoVal = 'pendiente';
  if (estado) {
    const val = String(estado).toLowerCase();
    if (val.includes('realiz')) estadoVal = 'realizada';
    else if (val.includes('confir') || val.includes('activa')) estadoVal = 'confirmada';
    else if (val.includes('cancel')) estadoVal = 'cancelada';
    else estadoVal = 'pendiente';
  }

  let fields = ["estado = ?"];
  let params = [estadoVal];

  if (estado_pago) {
    let ep = 'pendiente';
    const epVal = String(estado_pago).toLowerCase();
    if (epVal.includes('pagad')) ep = 'pagado';
    else if (epVal.includes('parcial')) ep = 'parcial';
    fields.push("estado_pago = ?");
    params.push(ep);
  }

  params.push(id);
  db.query(`UPDATE reservas SET ${fields.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Estado de reserva actualizado a " + estadoVal });
  });
};

exports.assignGuiaAdmin = (req, res) => {
  res.json({ status: 'OK', mensaje: "Las reservas ya no manejan guías asignadas." });
};

exports.updateReservaAdmin = (req, res) => {
  const { id } = req.params;
  const { estado, estado_pago, fecha, hora, numero_personas, idioma, metodo_pago, precio_total } = req.body;

  let fields = [];
  let params = [];

  if (estado) {
    const val = String(estado).toLowerCase();
    const st = val.includes('realiz') ? 'realizada' : val.includes('confir') ? 'confirmada' : val.includes('cancel') ? 'cancelada' : 'pendiente';
    fields.push("estado = ?");
    params.push(st);
  }
  if (estado_pago) {
    const epVal = String(estado_pago).toLowerCase();
    const ep = epVal.includes('pagad') ? 'pagado' : epVal.includes('parcial') ? 'parcial' : 'pendiente';
    fields.push("estado_pago = ?");
    params.push(ep);
  }
  if (fecha) {
    fields.push("fecha = ?");
    params.push(String(fecha).substring(0, 10));
  }
  if (hora) {
    fields.push("hora = ?");
    params.push(hora);
  }
  if (numero_personas) {
    fields.push("numero_personas = ?");
    params.push(parseInt(numero_personas, 10));
  }
  if (idioma) {
    fields.push("idioma = ?");
    params.push(String(idioma).toLowerCase() === 'en' ? 'en' : 'es');
  }
  if (metodo_pago) {
    fields.push("metodo_pago = ?");
    params.push(metodo_pago);
  }
  if (precio_total) {
    fields.push("precio_total = ?");
    params.push(parseFloat(precio_total));
  }

  if (fields.length === 0) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'No hay campos para actualizar.' });
  }

  params.push(id);
  const sql = `UPDATE reservas SET ${fields.join(', ')} WHERE id = ?`;
  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Reserva actualizada correctamente" });
  });
};

exports.deleteReservaAdmin = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM reservas WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Reserva eliminada exitosamente" });
  });
};

// ================= GESTIÓN DE PAGOS =================
exports.getPagosAdmin = (req, res) => {
  const sql = `
    SELECT 
      r.id,
      r.usuario_id,
      r.fecha,
      r.precio_total as monto,
      r.metodo_pago,
      r.estado_pago as estado,
      u.nombre_usuario,
      r.codigo as reserva_codigo
    FROM reservas r
    LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
    ORDER BY r.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// ================= GESTIÓN DE CATEGORÍAS =================
exports.getCategorias = (req, res) => {
  res.json([
    { id: 1, nombre: 'Cultura', descripcion: 'Recorridos culturales', icono: 'FaLandmark', estado: 'Activo' },
    { id: 2, nombre: 'Naturaleza', descripcion: 'Ecoturismo y paisajes', icono: 'FaTree', estado: 'Activo' },
    { id: 3, nombre: 'Aventura', descripcion: 'Senderismo y experiencias', icono: 'FaCompass', estado: 'Activo' }
  ]);
};

exports.createCategoria = (req, res) => {
  res.json({ mensaje: "Categoría agregada correctamente", id: Date.now() });
};

exports.updateCategoria = (req, res) => {
  res.json({ mensaje: "Categoría actualizada correctamente" });
};

exports.deleteCategoria = (req, res) => {
  res.json({ mensaje: "Categoría eliminada" });
};

// ================= GESTIÓN DE COMENTARIOS, PROMOCIONES, NOTIFICACIONES Y CONFIGURACIÓN =================
exports.getComentariosAdmin = (req, res) => { res.json([]); };
exports.updateComentarioState = (req, res) => { res.json({ mensaje: "Comentario actualizado" }); };
exports.getPromocionesAdmin = (req, res) => { res.json([]); };
exports.createPromocionAdmin = (req, res) => { res.json({ mensaje: "Promoción creada" }); };
exports.getConfiguracion = (req, res) => {
  res.json({
    nombre_sitio: 'EmiTours Medellín',
    correo: 'contacto@emitours.com',
    telefono: '+57 300 123 4567',
    direccion: 'Medellín, Antioquia, Colombia',
    modo_defecto: 'light'
  });
};
exports.updateConfiguracion = (req, res) => { res.json({ mensaje: "Configuración actualizada" }); };
exports.getNotificaciones = (req, res) => { res.json([]); };


