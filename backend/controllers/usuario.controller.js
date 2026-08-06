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
  const { nombre_usuario, edad, sexo, correo, telefono, foto } = req.body;
  const correo_electronico = correo || req.body.correo_electronico;

  const sql = `
    UPDATE registro_usuarios 
    SET nombre_usuario=?, edad=?, sexo=?, correo_electronico=?, telefono=?, foto=?
    WHERE id_registro=?
  `;

  db.query(sql, [nombre_usuario, edad, sexo, correo_electronico, telefono, foto, id], (err) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      return res.status(500).json({ status: "ERROR", mensaje: err.sqlMessage || err.message });
    }
    
    db.query("SELECT * FROM registro_usuarios WHERE id_registro = ?", [id], (err2, result) => {
      if (err2 || result.length === 0) {
        return res.json({ mensaje: "Usuario actualizado" });
      }
      res.json({ mensaje: "Usuario actualizado", user: result[0] });
    });
  });
};

// DELETE
exports.delete = (req, res) => {
  const { id } = req.params;

  // Primero eliminamos las reservas asociadas para evitar conflictos de llave foránea
  db.query("DELETE FROM reservas WHERE usuario_id = ?", [id], (errReservas) => {
    if (errReservas) {
      console.error("Error al eliminar reservas del usuario:", errReservas);
      return res.status(500).json(errReservas);
    }

    // Luego eliminamos el usuario
    db.query("DELETE FROM registro_usuarios WHERE id_registro = ?", [id], (err) => {
      if (err) {
        console.error("Error al eliminar usuario:", err);
        return res.status(500).json(err);
      }
      res.json({ mensaje: "Usuario eliminado exitosamente" });
    });
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
      res.json({ status: "OK", type: "user", user: result[0] });
    } else {
      // Si no está en usuarios normales, verificar en tabla administradores
      const adminSql = "SELECT * FROM administradores WHERE correo = ?";
      db.query(adminSql, [correo], async (errAdmin, adminRes) => {
        if (errAdmin || adminRes.length === 0) {
          return res.json({ status: "ERROR", mensaje: "Correo o contraseña incorrectos" });
        }

        const admin = adminRes[0];
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middlewares/authAdmin');

        const isMatch = (pass === admin.contrasena) || (await bcrypt.compare(pass, admin.contrasena));
        if (!isMatch) {
          return res.json({ status: "ERROR", mensaje: "Correo o contraseña incorrectos" });
        }

        const token = jwt.sign(
          { id: admin.id, correo: admin.correo, rol: admin.rol, nombre: admin.nombre },
          JWT_SECRET,
          { expiresIn: '12h' }
        );

        res.json({
          status: "OK",
          type: "admin",
          token,
          user: {
            id_registro: admin.id,
            nombre_usuario: admin.nombre + " (Admin)",
            correo_electronico: admin.correo,
            foto: admin.foto
          },
          admin
        });
      });
    }
  });
};

// CAMBIAR CONTRASEÑA
exports.changePassword = (req, res) => {
  const { id } = req.params;
  const { contrasenaActual, nuevaContrasena } = req.body;

  if (!contrasenaActual || !nuevaContrasena) {
    return res.status(400).json({ status: "ERROR", mensaje: "Debe proporcionar la contraseña actual y la nueva." });
  }

  db.query("SELECT contrasena FROM registro_usuarios WHERE id_registro = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ status: "ERROR", mensaje: "Usuario no encontrado" });

    if (result[0].contrasena !== contrasenaActual) {
      return res.status(400).json({ status: "ERROR", mensaje: "La contraseña actual es incorrecta" });
    }

    db.query("UPDATE registro_usuarios SET contrasena = ? WHERE id_registro = ?", [nuevaContrasena, id], (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ status: "OK", mensaje: "Contraseña actualizada exitosamente" });
    });
  });
};