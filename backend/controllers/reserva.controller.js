const db = require('../config/db');

// OBTENER RESERVAS (DE USUARIO O TODAS PARA ADMIN)
exports.getAll = (req, res) => {
  const { usuario_id } = req.query;

  let sql = `
    SELECT r.*, u.nombre_usuario, l.nombre as lugar_nombre, l.imagen as lugar_imagen
    FROM reservas r
    LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
    LEFT JOIN lugares l ON r.lugar_id = l.id
  `;

  let params = [];
  if (usuario_id) {
    sql += " WHERE r.usuario_id = ?";
    params.push(usuario_id);
  }

  sql += " ORDER BY r.id DESC";

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json(result);
  });
};

// CREAR RESERVA CON VALIDACIONES Y CONTROL DE CUPOS
exports.create = (req, res) => {
  const { usuario_id, nombre_completo, celular, lugar_id, fecha, hora, numero_personas, metodo_pago } = req.body;

  if (!nombre_completo || !celular || !lugar_id || !fecha || !hora || !numero_personas || !metodo_pago) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Todos los campos del formulario son obligatorios.' });
  }

  const cantidad = parseInt(numero_personas);

  // 1. Verificar cupos disponibles en el lugar turístico
  db.query("SELECT * FROM lugares WHERE id = ?", [lugar_id], (errLugar, resLugar) => {
    if (errLugar || resLugar.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'Lugar turístico no encontrado.' });
    }

    const lugar = resLugar[0];
    const cuposActuales = lugar.cupos_disponibles !== undefined ? lugar.cupos_disponibles : 20;

    if (cuposActuales < cantidad || cuposActuales <= 0) {
      return res.status(400).json({ status: 'ERROR', mensaje: 'Sin disponibilidad. No quedan cupos suficientes para esta fecha y horario.' });
    }

    // 2. Generar Código Único de Reserva (ej: RES-849201)
    const codigo = `RES-${Math.floor(100000 + Math.random() * 900000)}`;
    const precioTotal = (lugar.precio || 100000) * cantidad;

    // 3. Insertar reserva con estado "Pendiente"
    const sqlInsert = `
      INSERT INTO reservas (usuario_id, lugar_id, codigo, nombre_completo, celular, fecha, hora, numero_personas, metodo_pago, precio_total, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')
    `;

    db.query(sqlInsert, [usuario_id || null, lugar_id, codigo, nombre_completo, celular, fecha, hora, cantidad, metodo_pago, precioTotal], (errInsert, resInsert) => {
      if (errInsert) {
        return res.status(500).json({ status: 'ERROR', mensaje: errInsert.sqlMessage || errInsert.message });
      }

      // 4. Descontar cupos disponibles en el lugar
      const nuevosCupos = cuposActuales - cantidad;
      db.query("UPDATE lugares SET cupos_disponibles = ? WHERE id = ?", [nuevosCupos, lugar_id]);

      // 5. Crear notificación interna para el administrador
      db.query("INSERT INTO notificaciones (tipo, mensaje) VALUES ('Reserva', ?)", [
        `Nueva reserva ${codigo} recibida para ${lugar.nombre} (${cantidad} pers).`
      ]);

      res.json({
        status: 'OK',
        mensaje: '✅ Reserva registrada exitosamente. Estado: Pendiente de confirmación.',
        codigo,
        reservaId: resInsert.insertId
      });
    });
  });
};

// ACTUALIZAR ESTADO DE RESERVA (CONFIRMAR O RECHAZAR)
exports.update = (req, res) => {
  const { id } = req.params;
  const { estado, numero_personas } = req.body;

  db.query("SELECT * FROM reservas WHERE id = ?", [id], (err, resReserva) => {
    if (err || resReserva.length === 0) return res.status(404).json({ status: 'ERROR', mensaje: 'Reserva no encontrada.' });

    const reservaAnt = resReserva[0];
    const estadoAnterior = reservaAnt.estado;

    db.query("UPDATE reservas SET estado = ? WHERE id = ?", [estado, id], (errUp) => {
      if (errUp) return res.status(500).json(errUp);

      // Si se rechaza o cancela una reserva previamente confirmada/pendiente, restaurar cupos
      if ((estado === 'Rechazada' || estado === 'Cancelada') && (estadoAnterior === 'Pendiente' || estadoAnterior === 'Confirmada')) {
        db.query("UPDATE lugares SET cupos_disponibles = cupos_disponibles + ? WHERE id = ?", [reservaAnt.numero_personas, reservaAnt.lugar_id]);
      }

      res.json({ status: 'OK', mensaje: `Reserva ${estado} correctamente.` });
    });
  });
};

// ELIMINAR RESERVA
exports.delete = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM reservas WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ status: 'OK', mensaje: "Reserva eliminada" });
  });
};