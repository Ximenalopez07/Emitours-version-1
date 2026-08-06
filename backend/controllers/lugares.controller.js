const db = require('../config/db');

// GET todos los lugares
exports.getAll = (req, res) => {
  db.query("SELECT * FROM lugares", (err, result) => {
    if (err) {
      console.error("Error al obtener lugares:", err);
      return res.status(500).json({
        status: "ERROR",
        mensaje: err.sqlMessage || err.message || "Error al obtener lugares de la base de datos"
      });
    }
    res.json(result);
  });
};
