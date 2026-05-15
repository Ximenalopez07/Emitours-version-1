const db = require('../config/db');

// GET todos
exports.getAll = (req, res) => {
  db.query("SELECT * FROM registro_usuarios", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// GET por ID
exports.getById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM registro_usuarios WHERE id_registro = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

// POST
exports.create = (req, res) => {
  console.log("RECIBIDA PETICIÓN DE REGISTRO:", req.body);
  const { nombre_usuario, edad, sexo, cedula, correo, pass } = req.body;

  const sql = `
    INSERT INTO registro_usuarios 
    (nombre_usuario, edad, sexo, cedula, correo_electronico, contrasena)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre_usuario, edad, sexo, cedula, correo, pass], (err) => {
    if (err) {
      console.error("ERROR EN REGISTRO:", err);
      return res.status(500).json({ status: "ERROR", mensaje: err.sqlMessage || err.message || "Error interno del servidor" });
    }
    res.json({ mensaje: "Usuario creado" });
  });
};

// PUT
exports.update = (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, edad, sexo, correo } = req.body;

  const sql = `
    UPDATE registro_usuarios 
    SET nombre_usuario=?, edad=?, sexo=?, correo_electronico=?
    WHERE id_registro=?
  `;

  db.query(sql, [nombre_usuario, edad, sexo, correo, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Usuario actualizado" });
  });
};

// DELETE
exports.delete = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM registro_usuarios WHERE id_registro = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Usuario eliminado" });
  });
};

// LOGIN
exports.login = (req, res) => {
  console.log("RECIBIDA PETICIÓN DE LOGIN:", req.body);
  const { correo, pass } = req.body;

  const sql = "SELECT * FROM registro_usuarios WHERE correo_electronico = ? AND contrasena = ?";
  db.query(sql, [correo, pass], (err, result) => {
    if (err) return res.status(500).json(err);
    
    if (result.length > 0) {
      res.json({ status: "OK", user: result[0] });
    } else {
      res.json({ status: "ERROR", mensaje: "Correo o contraseña incorrectos" });
    }
  });
};