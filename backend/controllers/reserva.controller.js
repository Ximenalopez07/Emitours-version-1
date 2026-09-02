const db = require('../config/db');

// Helper para convertir hora a formato TIME 'HH:MM:SS'
function formatTimeToSql(hStr) {
  if (!hStr) return '07:00:00';
  const clean = hStr.trim();
  if (clean.includes('AM') || clean.includes('PM')) {
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const mAndPeriod = parts[1].split(' ');
    let m = parseInt(mAndPeriod[0], 10) || 0;
    const period = mAndPeriod[1] ? mAndPeriod[1].toUpperCase() : 'AM';
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseInt(match[3] || '0', 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return '07:00:00';
}

// Normalizar método de pago al enum ('nequi', 'pse', 'efectivo', 'datafono')
function normalizeMetodoPago(mp) {
  if (!mp) return 'nequi';
  const val = String(mp).toLowerCase();
  if (val.includes('nequi')) return 'nequi';
  if (val.includes('pse')) return 'pse';
  if (val.includes('efectivo')) return 'efectivo';
  if (val.includes('dataf') || val.includes('datáf')) return 'datafono';
  return 'nequi';
}

// Normalizar estado al enum ('pendiente', 'confirmada', 'cancelada')
function normalizeEstado(st) {
  if (!st) return 'pendiente';
  const val = String(st).toLowerCase();
  if (val.includes('confir') || val.includes('activa')) return 'confirmada';
  if (val.includes('cancel')) return 'cancelada';
  return 'pendiente';
}

// Normalizar estado_pago al enum ('pendiente', 'pagado')
function normalizeEstadoPago(ep) {
  if (!ep) return 'pendiente';
  const val = String(ep).toLowerCase();
  if (val.includes('pagad')) return 'pagado';
  return 'pendiente';
}

// ==========================================
// OBTENER RESERVAS (DE USUARIO O TODAS)
// ==========================================
exports.getAll = (req, res) => {
  const { usuario_id } = req.query;

  let sql = `
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
      u.correo_electronico,
      u.telefono,
      l.nombre as lugar_nombre,
      l.imagen as lugar_imagen
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

// ==========================================
// CREAR RESERVA CON INSERT ESPECIFICANDO COLUMNAS
// ==========================================
exports.create = (req, res) => {
  const { usuario_id, lugar_id, fecha, hora, numero_personas, idioma, idioma_tour, metodo_pago, opcion_pago } = req.body;
  const idiomaRaw = idioma || idioma_tour;

  const uId = usuario_id || req.body.id_usuario || req.body.userId || req.user?.id || req.user?.id_registro;
  const lId = lugar_id || req.body.id_lugar || req.body.tour_id;

  if (!uId || !lId || !fecha) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Faltan datos obligatorios para la reserva (usuario, lugar o fecha).' });
  }

  // 1. Validar presencia e Idioma ('es' o 'en' ÚNICAMENTE)
  const idiomaClean = (String(idiomaRaw || 'es').toLowerCase().trim() === 'en') ? 'en' : 'es';

  // 2. Validar método de pago permitido
  const metodoPagoEnum = normalizeMetodoPago(metodo_pago);

  // 3. Validar horario entre 07:00:00 y 19:00:00
  const horaSql = formatTimeToSql(hora || '07:00 AM');
  const [hStr, mStr] = horaSql.split(':');
  const hNum = parseInt(hStr, 10);
  const mNum = parseInt(mStr, 10);

  if (hNum < 7 || hNum > 19 || (hNum === 19 && mNum > 0)) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'El horario disponible para realizar reservas es de 7:00 AM a 7:00 PM.' });
  }

  // 4. Formatear fecha
  const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : String(fecha).substring(0, 10);

  // 5. Contar reservas para lugar_id + fecha (Máximo 20 reservas)
  const sqlCount = `
    SELECT COUNT(*) as total_reservas 
    FROM reservas 
    WHERE lugar_id = ? AND fecha = ? AND (estado != 'cancelada')
  `;

  db.query(sqlCount, [lId, fechaStr], (errCount, resCount) => {
    if (errCount) return res.status(500).json({ status: 'ERROR', mensaje: errCount.sqlMessage || errCount.message });

    const totalReservas = resCount[0]?.total_reservas || 0;
    if (totalReservas >= 20) {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'Lo sentimos, este lugar ya alcanzó el límite de 20 reservas para esta fecha. Por favor selecciona otra fecha o lugar.'
      });
    }

    // 6. Obtener precio del lugar
    db.query("SELECT * FROM lugares WHERE id = ?", [lId], (errLugar, resLugar) => {
      if (errLugar || resLugar.length === 0) {
        return res.status(404).json({ status: 'ERROR', mensaje: 'Lugar turístico no encontrado.' });
      }

      const lugar = resLugar[0];
      const cantidadPersonas = parseInt(numero_personas, 10) || 1;
      const precioTotal = parseFloat(((lugar.precio || 150000) * cantidadPersonas).toFixed(2));
      const codigo = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

      const estadoPagoEnum = 'pendiente';
      const estadoEnum = 'pendiente';

      // 7. INSERT ESPECIFICANDO EXACTAMENTE LOS NOMBRES DE LAS COLUMNAS
      const sqlInsert = `
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

      db.query(sqlInsert, [
        uId,
        lId,
        fechaStr,
        horaSql,
        cantidadPersonas,
        idiomaClean,
        precioTotal,
        metodoPagoEnum,
        estadoPagoEnum,
        estadoEnum,
        codigo
      ], (errInsert, resInsert) => {
        if (errInsert) return res.status(500).json({ status: 'ERROR', mensaje: errInsert.sqlMessage || errInsert.message });

        db.query("INSERT INTO notificaciones (tipo, mensaje) VALUES ('Reserva', ?)", [
          `Nueva reserva ${codigo} recibida para ${lugar.nombre} (${cantidadPersonas} pers, Idioma: ${idiomaClean === 'en' ? 'Inglés' : 'Español'}).`
        ], () => {});

        res.json({
          status: 'OK',
          mensaje: '✅ Reserva registrada exitosamente.',
          codigo,
          reservaId: resInsert.insertId,
          reservasRestantesFecha: 20 - (totalReservas + 1)
        });
      });
    });
  });
};

// ==========================================
// ACTUALIZAR RESERVA
// ==========================================
exports.update = (req, res) => {
  const { id } = req.params;
  const { estado, estado_pago, fecha, hora, numero_personas, idioma, metodo_pago } = req.body;

  let updateFields = [];
  let params = [];

  if (estado) {
    updateFields.push("estado = ?");
    params.push(normalizeEstado(estado));
  }

  if (estado_pago) {
    updateFields.push("estado_pago = ?");
    params.push(normalizeEstadoPago(estado_pago));
  }

  if (fecha) {
    updateFields.push("fecha = ?");
    params.push(fecha instanceof Date ? fecha.toISOString().split('T')[0] : String(fecha).substring(0, 10));
  }

  if (hora) {
    updateFields.push("hora = ?");
    params.push(formatTimeToSql(hora));
  }

  if (numero_personas) {
    updateFields.push("numero_personas = ?");
    params.push(parseInt(numero_personas, 10));
  }

  if (idioma) {
    updateFields.push("idioma = ?");
    params.push(idioma.toLowerCase() === 'en' ? 'en' : 'es');
  }

  if (metodo_pago) {
    updateFields.push("metodo_pago = ?");
    params.push(normalizeMetodoPago(metodo_pago));
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Debes especificar al menos un campo a actualizar.' });
  }

  params.push(id);
  const sql = `UPDATE reservas SET ${updateFields.join(', ')} WHERE id = ?`;

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: 'Reserva actualizada correctamente.' });
  });
};

// ==========================================
// ELIMINAR RESERVA
// ==========================================
exports.delete = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM reservas WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
    res.json({ status: 'OK', mensaje: "Reserva eliminada exitosamente." });
  });
};