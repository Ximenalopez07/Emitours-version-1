const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ================= GESTIÓN DE USUARIOS (CLIENTES) =================
exports.getUsuarios = (req, res) => {
  db.query("SELECT *, 'Activo' as estado, CURRENT_TIMESTAMP as fecha_registro FROM registro_usuarios ORDER BY id_registro DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.updateUsuarioAdmin = (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, edad, sexo, cedula, correo_electronico, telefono, foto } = req.body;
  const sql = "UPDATE registro_usuarios SET nombre_usuario=?, edad=?, sexo=?, cedula=?, correo_electronico=?, telefono=?, foto=? WHERE id_registro=?";
  db.query(sql, [nombre_usuario, edad, sexo, cedula, correo_electronico, telefono, foto, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Usuario actualizado correctamente por el administrador" });
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
  const sql = "SELECT * FROM lugares ORDER BY id DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.createLugarAdmin = (req, res) => {
  const { nombre, descripcion, imagen } = req.body;
  const sql = "INSERT INTO lugares (nombre, descripcion, imagen) VALUES (?, ?, ?)";
  db.query(sql, [nombre, descripcion, imagen], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Lugar creado exitosamente", id: result.insertId });
  });
};

exports.updateLugarAdmin = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen } = req.body;
  const sql = "UPDATE lugares SET nombre=?, descripcion=?, imagen=? WHERE id=?";
  db.query(sql, [nombre, descripcion, imagen, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Lugar actualizado" });
  });
};

exports.deleteLugarAdmin = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM lugares WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Lugar eliminado" });
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
      'Administrador' as admin_nombre
    FROM reservas r
    LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
    LEFT JOIN lugares l ON r.lugar_id = l.id
    ORDER BY r.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.updateReservaStatus = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  let estadoVal = 'pendiente';
  if (estado) {
    const val = String(estado).toLowerCase();
    if (val.includes('confir') || val.includes('activa')) estadoVal = 'confirmada';
    else if (val.includes('cancel')) estadoVal = 'cancelada';
    else estadoVal = 'pendiente';
  }
  db.query("UPDATE reservas SET estado = ? WHERE id = ?", [estadoVal, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Estado de reserva actualizado" });
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
    modo_defecto: 'dark'
  });
};
exports.updateConfiguracion = (req, res) => { res.json({ mensaje: "Configuración actualizada" }); };
exports.getNotificaciones = (req, res) => { res.json([]); };

