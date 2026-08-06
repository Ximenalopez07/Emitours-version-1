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
  db.query("SELECT id, nombre, apellido, documento, correo, telefono, rol, estado, foto, fecha_creacion FROM administradores ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.createAdministrador = async (req, res) => {
  const { nombre, apellido, documento, correo, contrasena, telefono, rol } = req.body;
  try {
    const hashed = await bcrypt.hash(contrasena || 'Admin123*', 10);
    const sql = "INSERT INTO administradores (nombre, apellido, documento, correo, contrasena, telefono, rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')";
    db.query(sql, [nombre, apellido, documento, correo, hashed, telefono, rol || 'Administrador'], (err, result) => {
      if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
      res.json({ status: 'OK', mensaje: "Administrador creado exitosamente", id: result.insertId });
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', mensaje: err.message });
  }
};

exports.updateAdministrador = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, documento, correo, telefono, rol, estado, contrasena } = req.body;
  try {
    if (contrasena && contrasena.trim() !== '') {
      const hashed = await bcrypt.hash(contrasena, 10);
      const sql = "UPDATE administradores SET nombre=?, apellido=?, documento=?, correo=?, telefono=?, rol=?, estado=?, contrasena=? WHERE id=?";
      db.query(sql, [nombre, apellido, documento, correo, telefono, rol, estado, hashed, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Administrador actualizado con nueva contraseña" });
      });
    } else {
      const sql = "UPDATE administradores SET nombre=?, apellido=?, documento=?, correo=?, telefono=?, rol=?, estado=? WHERE id=?";
      db.query(sql, [nombre, apellido, documento, correo, telefono, rol, estado, id], (err) => {
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
  db.query("DELETE FROM administradores WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Administrador eliminado" });
  });
};

// ================= GESTIÓN DE LUGARES TURÍSTICOS =================
exports.getLugaresAdmin = (req, res) => {
  const sql = `
    SELECT l.*, c.nombre as categoria_nombre 
    FROM lugares l 
    LEFT JOIN categorias c ON l.categoria_id = c.id 
    ORDER BY l.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.createLugarAdmin = (req, res) => {
  const { nombre, descripcion, precio, ubicacion, categoria_id, duracion, capacidad, estado, imagen, galeria, servicios } = req.body;
  const sql = "INSERT INTO lugares (nombre, descripcion, precio, ubicacion, categoria_id, duracion, capacidad, estado, imagen, galeria, servicios) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [nombre, descripcion, precio || 100000, ubicacion || 'Medellín', categoria_id || 1, duracion || '4 Horas', capacidad || 20, estado || 'Activo', imagen, JSON.stringify(galeria || []), servicios], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Lugar creado exitosamente", id: result.insertId });
  });
};

exports.updateLugarAdmin = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, ubicacion, categoria_id, duracion, capacidad, estado, imagen, servicios } = req.body;
  const sql = "UPDATE lugares SET nombre=?, descripcion=?, precio=?, ubicacion=?, categoria_id=?, duracion=?, capacidad=?, estado=?, imagen=?, servicios=? WHERE id=?";
  db.query(sql, [nombre, descripcion, precio, ubicacion, categoria_id, duracion, capacidad, estado, imagen, servicios, id], (err) => {
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
  db.query("SELECT * FROM categorias ORDER BY id ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.createCategoria = (req, res) => {
  const { nombre, descripcion, icono } = req.body;
  db.query("INSERT INTO categorias (nombre, descripcion, icono) VALUES (?, ?, ?)", [nombre, descripcion, icono || 'FaFolder'], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Categoría creada", id: result.insertId });
  });
};

exports.updateCategoria = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, icono, estado } = req.body;
  db.query("UPDATE categorias SET nombre=?, descripcion=?, icono=?, estado=? WHERE id=?", [nombre, descripcion, icono, estado, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Categoría actualizada" });
  });
};

exports.deleteCategoria = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM categorias WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Categoría eliminada" });
  });
};

// ================= GESTIÓN DE RESERVAS (COMPLETA) =================
exports.getReservasAdmin = (req, res) => {
  const sql = `
    SELECT r.*, u.nombre_usuario, u.correo_electronico, u.telefono, l.nombre as lugar_nombre, a.nombre as admin_nombre
    FROM reservas r
    LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
    LEFT JOIN lugares l ON r.lugar_id = l.id
    LEFT JOIN administradores a ON r.admin_responsable_id = a.id
    ORDER BY r.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.updateReservaStatus = (req, res) => {
  const { id } = req.params;
  const { estado, admin_responsable_id } = req.body;
  db.query("UPDATE reservas SET estado = ?, admin_responsable_id = ? WHERE id = ?", [estado, admin_responsable_id || req.admin.id, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Estado de reserva actualizado" });
  });
};

// ================= GESTIÓN DE PAGOS =================
exports.getPagosAdmin = (req, res) => {
  const sql = `
    SELECT p.*, r.codigo as reserva_codigo, u.nombre_usuario 
    FROM pagos p
    LEFT JOIN reservas r ON p.reserva_id = r.id
    LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// ================= GESTIÓN DE COMENTARIOS Y MODERACIÓN =================
exports.getComentariosAdmin = (req, res) => {
  const sql = `
    SELECT c.*, u.nombre_usuario, l.nombre as lugar_nombre
    FROM comentarios c
    LEFT JOIN registro_usuarios u ON c.usuario_id = u.id_registro
    LEFT JOIN lugares l ON c.lugar_id = l.id
    ORDER BY c.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.updateComentarioState = (req, res) => {
  const { id } = req.params;
  const { estado, respuesta_admin } = req.body;
  db.query("UPDATE comentarios SET estado = ?, respuesta_admin = ? WHERE id = ?", [estado, respuesta_admin, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Comentario moderado correctamente" });
  });
};

// ================= NOTICIAS Y PROMOCIONES =================
exports.getPromocionesAdmin = (req, res) => {
  db.query("SELECT * FROM noticias_promociones ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.createPromocionAdmin = (req, res) => {
  const { tipo, titulo, descripcion, descuento_porcentaje, cupon, fecha_inicio, fecha_fin } = req.body;
  db.query("INSERT INTO noticias_promociones (tipo, titulo, descripcion, descuento_porcentaje, cupon, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?, ?, ?)", [tipo || 'Promocion', titulo, descripcion, descuento_porcentaje || 0, cupon, fecha_inicio, fecha_fin], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Promoción/Noticia creada", id: result.insertId });
  });
};

// ================= CONFIGURACIÓN DEL SITIO =================
exports.getConfiguracion = (req, res) => {
  db.query("SELECT * FROM configuracion_sitio WHERE id = 1", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result.length ? result[0] : {});
  });
};

exports.updateConfiguracion = (req, res) => {
  const { nombre_sitio, correo, telefono, direccion, redes_sociales, colores, modo_defecto } = req.body;
  const sql = "UPDATE configuracion_sitio SET nombre_sitio=?, correo=?, telefono=?, direccion=?, redes_sociales=?, colores=?, modo_defecto=? WHERE id=1";
  db.query(sql, [nombre_sitio, correo, telefono, direccion, JSON.stringify(redes_sociales || {}), JSON.stringify(colores || {}), modo_defecto || 'dark'], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Configuración del sitio actualizada" });
  });
};

// ================= NOTIFICACIONES =================
exports.getNotificaciones = (req, res) => {
  db.query("SELECT * FROM notificaciones ORDER BY id DESC LIMIT 20", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};
