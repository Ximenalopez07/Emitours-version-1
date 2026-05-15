const db = require('../config/db');

const Reserva = {

  getAll: (callback) => {

    const sql = `
      SELECT r.*, u.nombre_usuario
      FROM reservas r
      JOIN registro_usuarios u
      ON r.usuario_id = u.id_registro
    `;

    db.query(sql, callback);

  },

  create: (data, callback) => {

    const sql = `
      INSERT INTO reservas
      (usuario_id, fecha, hora, numero_personas, estado)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      data.usuario_id,
      data.fecha,
      data.hora,
      data.numero_personas,
      data.estado
    ], callback);

  },

  update: (id, data, callback) => {

    const sql = `
      UPDATE reservas
      SET numero_personas=?, estado=?
      WHERE id=?
    `;

    db.query(sql, [
      data.numero_personas,
      data.estado,
      id
    ], callback);

  },

  delete: (id, callback) => {

    db.query(
      'DELETE FROM reservas WHERE id=?',
      [id],
      callback
    );

  }

};

module.exports = Reserva;