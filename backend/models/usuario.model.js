const db = require('../config/db');

const Reserva = {
  getAll: (callback) => {
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
        l.nombre as lugar_nombre
      FROM reservas r
      LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
      LEFT JOIN lugares l ON r.lugar_id = l.id
      ORDER BY r.id DESC
    `;
    db.query(sql, callback);
  },

  create: (data, callback) => {
    const sql = `
      INSERT INTO reservas (
        usuario_id,
        lugar_id,
        fecha,
        hora,
        numero_personas,
        idioma,
        precio_total,
        metodo_pago,
        estado_pago,
        estado,
        codigo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [
      data.usuario_id,
      data.lugar_id || 1,
      data.fecha,
      data.hora,
      data.numero_personas,
      data.idioma || 'es',
      data.precio_total || 150000,
      data.metodo_pago || 'nequi',
      data.estado_pago || 'pendiente',
      data.estado || 'pendiente',
      data.codigo || `RES-${Date.now()}`
    ], callback);
  },

  update: (id, data, callback) => {
    const sql = `
      UPDATE reservas
      SET 
        numero_personas = COALESCE(?, numero_personas),
        estado = COALESCE(?, estado),
        estado_pago = COALESCE(?, estado_pago)
      WHERE id = ?
    `;
    db.query(sql, [
      data.numero_personas,
      data.estado,
      data.estado_pago,
      id
    ], callback);
  },

  delete: (id, callback) => {
    db.query('DELETE FROM reservas WHERE id=?', [id], callback);
  }
};

module.exports = Reserva;