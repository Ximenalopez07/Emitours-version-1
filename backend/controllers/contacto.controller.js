const db = require('../config/db');

// GUARDAR MENSAJE DE CONTACTO (SOLO NOMBRE, ASUNTO, MENSAJE)
exports.createMensaje = (req, res) => {
  const { usuario_id, nombre, asunto, mensaje } = req.body;

  if (!nombre || !asunto || !mensaje) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Todos los campos (Nombre, Asunto y Mensaje) son obligatorios.' });
  }

  const sql = "INSERT INTO mensajes_contacto (usuario_id, nombre, asunto, mensaje) VALUES (?, ?, ?, ?)";
  db.query(sql, [usuario_id || null, nombre, asunto, mensaje], (err, result) => {
    if (err) {
      console.error("Error al guardar mensaje de contacto:", err);
      return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    }

    // Notificación al Administrador
    db.query("INSERT INTO notificaciones (tipo, mensaje) VALUES ('Contacto', ?)", [
      `Nuevo mensaje de contacto recibido de ${nombre}: "${asunto}"`
    ]);

    res.json({
      status: 'OK',
      mensaje: '✅ Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo a la brevedad.'
    });
  });
};

// OBTENER MENSAJES DE CONTACTO (PARA PANEL DE ADMINISTRACIÓN)
exports.getMensajesAdmin = (req, res) => {
  db.query("SELECT * FROM mensajes_contacto ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// RESPONDER MENSAJE DE CONTACTO (ADMIN)
exports.responderMensajeAdmin = (req, res) => {
  const { id } = req.params;
  const { respuesta_admin } = req.body;

  db.query("UPDATE mensajes_contacto SET estado = 'Respondido', respuesta_admin = ? WHERE id = ?", [respuesta_admin, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ status: 'OK', mensaje: 'Respuesta guardada y enviada al turista.' });
  });
};
