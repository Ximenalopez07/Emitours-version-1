const db = require('../config/db');

// GET todos los guías
exports.getAll = (req, res) => {
  db.query("SELECT * FROM guias", (err, result) => {
    if (err) {
      console.error("Error al obtener guías:", err);
      return res.status(500).json({
        status: "ERROR",
        mensaje: err.sqlMessage || err.message || "Error al obtener guías de la base de datos"
      });
    }
    res.json(result);
  });
};

// GET guía por ID
exports.getById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM guias WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ mensaje: "Guía no encontrado" });
    res.json(result[0]);
  });
};
