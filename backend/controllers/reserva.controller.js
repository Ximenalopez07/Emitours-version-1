const db = require('../config/db');

// GET con JOIN (IMPORTANTE 👀)
exports.getAll = (req, res) => {
  const sql = `
    SELECT r.*, u.nombre_usuario
    FROM reservas r
    JOIN registro_usuarios u
    ON r.usuario_id = u.id_registro
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// POST
exports.create = (req, res) => {
  const { usuario_id, fecha, hora, numero_personas, estado } = req.body;

  const sql = `
    INSERT INTO reservas (usuario_id, fecha, hora, numero_personas, estado)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [usuario_id, fecha, hora, numero_personas, estado], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Reserva creada" });
  });
};

// PUT
exports.update = (req, res) => {
  console.log("ID:", req.params.id);
  console.log("BODY:", req.body);

  const { id } = req.params;
  const { numero_personas, estado } = req.body;

  const sql = `
    UPDATE reservas
    SET numero_personas=?, estado=?
    WHERE id=?
  `;

  db.query(sql, [numero_personas, estado, id], (err, result) => {
    if (err) return res.status(500).json(err);

    console.log("RESULT:", result);

    res.json({ mensaje: "Reserva actualizada" });
  });
};
// DELETE
exports.delete = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM reservas WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Reserva eliminada" });
  });
};