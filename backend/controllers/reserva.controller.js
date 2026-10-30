const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authAdmin');
const { enviarNotificacionNuevaReserva, enviarNotificacionCancelacionReserva } = require('../utils/mailer');
const { validarConflictoReserva } = require('../utils/validacionesReserva');
const { actualizarReservasFinalizadas } = require('../services/reservaEstadoService');

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

// Normalizar método de pago al enum ('nequi', 'pse', 'efectivo', 'datafono', 'mercadopago')
function normalizeMetodoPago(mp) {
  if (!mp) return 'mercadopago';
  const val = String(mp).toLowerCase();
  if (val.includes('mercado') || val.includes('mp')) return 'mercadopago';
  if (val.includes('nequi')) return 'nequi';
  if (val.includes('pse')) return 'pse';
  if (val.includes('efectivo')) return 'efectivo';
  if (val.includes('dataf') || val.includes('datáf')) return 'datafono';
  return 'mercadopago';
}

// Normalizar estado al enum ('pendiente', 'confirmada', 'cancelada', 'realizada')
function normalizeEstado(st) {
  if (!st) return 'pendiente';
  const val = String(st).toLowerCase();
  if (val.includes('realiz')) return 'realizada';
  if (val.includes('confir') || val.includes('activa')) return 'confirmada';
  if (val.includes('cancel')) return 'cancelada';
  return 'pendiente';
}

// Normalizar estado_pago al enum ('pendiente', 'parcial', 'pagado')
function normalizeEstadoPago(ep) {
  if (!ep) return 'pendiente';
  const val = String(ep).toLowerCase();
  if (val.includes('parcial') || val.includes('50%')) return 'parcial';
  if (val.includes('pagad')) return 'pagado';
  return 'pendiente';
}

// ==========================================
// OBTENER RESERVAS (DE USUARIO O TODAS)
// ==========================================
exports.getAll = async (req, res) => {
  const { usuario_id } = req.query;

  // Actualizar automáticamente reservas en curso cuyo tour ya finalizó en horario de Colombia
  try {
    await actualizarReservasFinalizadas();
  } catch (errSync) {
    console.warn('[Reserva Controller] Aviso no bloqueante al sincronizar reservas finalizadas:', errSync.message);
  }

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
      r.mp_payment_id,
      r.monto_pagado,
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
exports.create = async (req, res) => {
  const {
    usuario_id,
    lugar_id,
    fecha,
    hora,
    numero_personas,
    idioma,
    idioma_tour,
    metodo_pago,
    opcion_pago,
    precio_total,
    mp_payment_id,
    monto_abonado
  } = req.body;
  const idiomaRaw = idioma || idioma_tour;

  // 1. Obtener identidad del usuario desde token JWT verificado o req.user
  let uId = req.user?.id || req.user?.id_registro;
  if (!uId) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        uId = decoded.id || decoded.id_registro;
        req.user = decoded;
      } catch (e) {
        // Token inválido
      }
    }
  }

  // Si no se obtuvo de la cabecera, usar el id enviado asegurando que exista
  if (!uId) {
    uId = usuario_id || req.body.id_usuario || req.body.userId;
  }

  const lId = lugar_id || req.body.id_lugar || req.body.tour_id;

  if (!uId || !lId || !fecha) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'Faltan datos obligatorios para la reserva (usuario, lugar o fecha).' });
  }

  // 2. Validar presencia e Idioma ('es' o 'en' ÚNICAMENTE)
  const idiomaClean = (String(idiomaRaw || 'es').toLowerCase().trim() === 'en') ? 'en' : 'es';

  // 3. Validar método de pago permitido
  const metodoPagoEnum = normalizeMetodoPago(metodo_pago);

  // 4. Validar horario entre 07:00:00 y 19:00:00
  const horaSql = formatTimeToSql(hora || '07:00 AM');
  const [hStr, mStr] = horaSql.split(':');
  const hNum = parseInt(hStr, 10);
  const mNum = parseInt(mStr, 10);

  if (hNum < 7 || hNum > 19 || (hNum === 19 && mNum > 0)) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'El horario disponible para realizar reservas es de 7:00 AM a 7:00 PM.' });
  }

  // 5. Formatear fecha a YYYY-MM-DD
  const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : String(fecha).substring(0, 10);

  let conn = null;
  let lockAdquirido = false;

  try {
    conn = await db.promise().getConnection();

    // 6. CONTROL DE CONCURRENCIA: Bloqueo a nivel de usuario para solicitudes simultáneas
    const [lockRes] = await conn.query("SELECT GET_LOCK(CONCAT('reserva_usr_', ?), 5) as lock_ok", [uId]);
    lockAdquirido = Boolean(lockRes && lockRes[0] && lockRes[0].lock_ok);

    // 7. Contar reservas para lugar_id + fecha (Límite de 20 reservas por destino)
    const [resCount] = await conn.query(
      "SELECT COUNT(*) as total_reservas FROM reservas WHERE lugar_id = ? AND fecha = ? AND (estado != 'cancelada')",
      [lId, fechaStr]
    );
    const totalReservas = resCount[0]?.total_reservas || 0;
    if (totalReservas >= 20) {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'Lo sentimos, este lugar ya alcanzó el límite de 20 reservas para esta fecha. Por favor selecciona otra fecha o lugar.'
      });
    }

    // 8. Obtener datos del lugar turístico
    const [resLugar] = await conn.query("SELECT * FROM lugares WHERE id = ?", [lId]);
    if (!resLugar || resLugar.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'Lugar turístico no encontrado.' });
    }
    const lugar = resLugar[0];

    // 9. VALIDACIÓN CRÍTICA: Consultar reservas activas del usuario en MySQL para esta fecha
    const [reservasExistentes] = await conn.query(
      `SELECT r.*, l.nombre as lugar_nombre 
       FROM reservas r 
       LEFT JOIN lugares l ON r.lugar_id = l.id 
       WHERE r.usuario_id = ? AND r.fecha = ? AND r.estado IN ('pendiente', 'confirmada')`,
      [uId, fechaStr]
    );

    // Validar superposición de horarios y regla especial para Guatapé
    const resultadoConflicto = validarConflictoReserva({
      lugarId: lId,
      lugarNombre: lugar.nombre,
      fecha: fechaStr,
      hora: horaSql,
      reservasExistentes
    });

    if (resultadoConflicto.hayConflicto) {
      return res.status(409).json({
        status: 'CONFLICTO_RESERVA',
        tipo: resultadoConflicto.tipo,
        titulo: resultadoConflicto.titulo,
        mensaje: resultadoConflicto.mensaje,
        detalles: resultadoConflicto.detalles
      });
    }

    // 10. Cálculo de importes y estado de pago
    const cantidadPersonas = parseInt(numero_personas, 10) || 1;
    const precioTotal = (precio_total && !isNaN(parseFloat(precio_total)))
      ? parseFloat(parseFloat(precio_total).toFixed(2))
      : parseFloat(((lugar.precio || 150000) * cantidadPersonas).toFixed(2));
    const codigo = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

    const opcClean = String(opcion_pago || '').toLowerCase();
    const esPagoTotal = (opcClean.includes('total') || opcClean.includes('100'));
    let estadoPagoEnum = esPagoTotal ? 'pagado' : 'parcial';
    const montoCalculado = esPagoTotal ? precioTotal : Math.round(precioTotal * 0.5);
    const saldoPendienteCalculado = esPagoTotal ? 0 : (precioTotal - montoCalculado);

    let estadoEnum = 'pendiente';
    let mpPaymentIdFinal = mp_payment_id ? String(mp_payment_id).trim() : null;
    let montoPagadoFinal = monto_abonado ? parseFloat(monto_abonado) : montoCalculado;

    // 11. Verificación de seguridad con Mercado Pago si se envía mp_payment_id
    if (mpPaymentIdFinal) {
      // Idempotencia: Verificar si esta transacción ya fue registrada
      const [resRepetido] = await conn.query(
        "SELECT id, codigo, estado, estado_pago, precio_total, monto_pagado FROM reservas WHERE mp_payment_id = ?",
        [mpPaymentIdFinal]
      );
      if (resRepetido && resRepetido.length > 0) {
        const existente = resRepetido[0];
        const saldoCalc = Math.max(0, (existente.precio_total || 0) - (existente.monto_pagado || 0));
        console.log(`[Reserva Controller] ℹ️ Transacción MP #${mpPaymentIdFinal} ya asociada a la reserva ${existente.codigo}. Retornando reserva existente.`);
        return res.json({
          status: 'OK',
          mensaje: `Esta reserva ya se encuentra registrada con el comprobante #${mpPaymentIdFinal}.`,
          codigo: existente.codigo,
          reservaId: existente.id,
          estado: existente.estado,
          estado_pago: existente.estado_pago,
          monto_pagado: existente.monto_pagado,
          saldo_pendiente: saldoCalc,
          ya_existia: true
        });
      }

      // Validar con SDK de Mercado Pago
      const tokenMP = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (tokenMP) {
        try {
          const { MercadoPagoConfig, Payment } = require('mercadopago');
          const clientMP = new MercadoPagoConfig({ accessToken: tokenMP });
          const payment = new Payment(clientMP);
          const paymentData = await payment.get({ id: mpPaymentIdFinal });

          if (!paymentData) {
            return res.status(400).json({ status: 'ERROR', mensaje: 'No se encontró la transacción en Mercado Pago.' });
          }

          if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
            return res.status(400).json({
              status: 'ERROR',
              mensaje: `El pago fue rechazado en Mercado Pago (${paymentData.status_detail || 'No autorizado'}). No es posible confirmar la reserva.`
            });
          }

          if (paymentData.status === 'approved') {
            const montoTransaccion = parseFloat(paymentData.transaction_amount || 0);
            if (montoTransaccion < (montoCalculado - 50)) {
              return res.status(400).json({
                status: 'ERROR',
                mensaje: `El monto pagado en Mercado Pago ($${montoTransaccion} COP) es menor al importe esperado ($${montoCalculado} COP).`
              });
            }
            montoPagadoFinal = montoTransaccion;
            estadoEnum = 'confirmada';
            estadoPagoEnum = esPagoTotal ? 'pagado' : 'parcial';
          } else if (paymentData.status === 'pending' || paymentData.status === 'in_process' || paymentData.status === 'authorized') {
            montoPagadoFinal = 0;
            estadoEnum = 'pendiente';
            estadoPagoEnum = 'pendiente';
          } else {
            return res.status(400).json({
              status: 'ERROR',
              mensaje: `El estado del pago (${paymentData.status}) no permite registrar la reserva.`
            });
          }
        } catch (errMP) {
          console.error('[Reserva Controller] Error al verificar transacción MP:', errMP.message);
          return res.status(400).json({
            status: 'ERROR',
            mensaje: 'No fue posible validar la transacción con Mercado Pago: ' + errMP.message
          });
        }
      }
    }

    // 12. INSERT EN TABLA RESERVAS
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
        codigo,
        mp_payment_id,
        monto_pagado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [resInsert] = await conn.query(sqlInsert, [
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
      codigo,
      mpPaymentIdFinal,
      montoPagadoFinal
    ]);

    // 13. Consultar datos del cliente para la notificación
    const [resUser] = await conn.query(
      "SELECT nombre_usuario, correo_electronico, telefono FROM registro_usuarios WHERE id_registro = ?",
      [uId]
    );
    const cliente = (resUser && resUser.length > 0) ? resUser[0] : null;
    const clienteNombre = cliente?.nombre_usuario || req.body.nombre_completo || 'Cliente EmiTours';
    const clienteCorreo = cliente?.correo_electronico || req.body.correo_electronico || 'No especificado';
    const clienteTelefono = cliente?.telefono || req.body.celular || 'No especificado';

    // Enviar notificación por correo al Administrador vía Resend (asíncrono y no bloqueante)
    enviarNotificacionNuevaReserva({
      codigo,
      clienteNombre,
      clienteCorreo,
      clienteTelefono,
      tourNombre: lugar.nombre,
      fecha: fechaStr,
      hora: hora || horaSql,
      numeroPersonas: cantidadPersonas,
      idioma: (idiomaClean === 'en') ? 'Inglés' : 'Español',
      precioTotal,
      metodoPago: metodoPagoEnum.toUpperCase(),
      estadoReserva: estadoEnum,
      estadoPago: estadoPagoEnum === 'pagado' ? 'Pagado (100%)' : `Parcial (50% abonado: $${montoPagadoFinal.toLocaleString()} COP, Saldo: $${saldoPendienteCalculado.toLocaleString()} COP)`
    }).catch(errMail => {
      console.error(`[Reserva Controller] ❌ Error no bloqueante al enviar correo de reserva ${codigo}:`, errMail.message);
    });

    // Notificación interna
    conn.query("INSERT INTO notificaciones (tipo, mensaje) VALUES ('Reserva', ?)", [
      `Nueva reserva ${codigo} confirmada para ${lugar.nombre} (${cantidadPersonas} pers, Pago MP: ${mpPaymentIdFinal || 'Directo'}).`
    ]).catch(() => {});

    // Responder al cliente confirmando la reserva exitosa
    return res.json({
      status: 'OK',
      mensaje: '✅ Reserva registrada exitosamente.',
      codigo,
      reservaId: resInsert.insertId,
      estado: estadoEnum,
      estado_pago: estadoPagoEnum,
      monto_pagado: montoPagadoFinal,
      saldo_pendiente: saldoPendienteCalculado,
      reservasRestantesFecha: 20 - (totalReservas + 1)
    });

  } catch (err) {
    console.error('[Reserva Controller] ❌ Error en create reserva:', err);
    return res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message || 'Error interno al crear reserva.' });
  } finally {
    if (conn) {
      if (lockAdquirido) {
        await conn.query("SELECT RELEASE_LOCK(CONCAT('reserva_usr_', ?))", [uId]).catch(() => {});
      }
      conn.release();
    }
  }
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

// ==========================================
// CANCELAR RESERVA POR EL USUARIO AUTENTICADO
// ==========================================
exports.cancelarReserva = async (req, res) => {
  const { id } = req.params;
  const usuarioAutenticadoId = req.user?.id || req.user?.id_registro;
  const esAdmin = req.user?.rol === 'Super Administrador' || req.user?.rol === 'admin' || Boolean(req.admin);

  if (!id) {
    return res.status(400).json({ status: 'ERROR', mensaje: 'ID de reserva no proporcionado.' });
  }

  try {
    // 1. Consultar la reserva existente con datos de usuario y lugar
    const [rows] = await db.promise().query(`
      SELECT 
        r.*,
        u.nombre_usuario,
        u.correo_electronico,
        u.telefono,
        l.nombre as lugar_nombre
      FROM reservas r
      LEFT JOIN registro_usuarios u ON r.usuario_id = u.id_registro
      LEFT JOIN lugares l ON r.lugar_id = l.id
      WHERE r.id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'Reserva no encontrada.' });
    }

    const reserva = rows[0];

    // 2. Verificar que la reserva pertenezca al usuario autenticado (a menos que sea administrador)
    if (!esAdmin && String(reserva.usuario_id) !== String(usuarioAutenticadoId)) {
      return res.status(403).json({
        status: 'ERROR',
        mensaje: 'No tienes autorización para cancelar una reserva que no te pertenece.'
      });
    }

    // 3. Validar si ya está cancelada
    const estadoActual = String(reserva.estado || '').toLowerCase();
    if (estadoActual.includes('cancel')) {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'Esta reserva ya se encuentra cancelada en el sistema.'
      });
    }

    // 4. Validar si ya fue realizada
    if (estadoActual.includes('realiz')) {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'No es posible cancelar una reserva que ya ha sido realizada.'
      });
    }

    // 5. Actualizar el estado a 'cancelada' en MySQL sin alterar datos financieros ni borrar registro
    await db.promise().query(
      "UPDATE reservas SET estado = 'cancelada' WHERE id = ?",
      [id]
    );

    console.log(`[Reserva Controller] ✅ Reserva #${reserva.codigo || id} cancelada exitosamente en MySQL por usuario ID ${usuarioAutenticadoId}.`);

    // 6. Notificación interna en base de datos
    db.query(
      "INSERT INTO notificaciones (tipo, mensaje) VALUES ('Cancelacion', ?)",
      [`El usuario ${reserva.nombre_usuario || 'Cliente'} canceló la reserva ${reserva.codigo || id} para el tour ${reserva.lugar_nombre || 'EmiTours'}. Estado: Reserva eliminada.`],
      () => {}
    );

    // 7. Enviar notificación por correo al Administrador vía Resend (asíncrono, no bloqueante)
    const totalCalc = Number(reserva.precio_total || 0);
    const pagadoCalc = (reserva.monto_pagado !== undefined && Number(reserva.monto_pagado) > 0)
      ? Number(reserva.monto_pagado)
      : (String(reserva.estado_pago || '').toLowerCase().includes('pagad') ? totalCalc : Math.round(totalCalc * 0.5));
    const saldoCalc = Math.max(0, totalCalc - pagadoCalc);

    const fechaCancelacionStr = new Date().toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });

    let envioCorreoExitoso = false;
    try {
      const resMail = await enviarNotificacionCancelacionReserva({
        codigo: reserva.codigo || `RES-${id}`,
        clienteNombre: reserva.nombre_usuario || 'Cliente EmiTours',
        clienteCorreo: reserva.correo_electronico || 'No especificado',
        clienteTelefono: reserva.telefono || 'No especificado',
        tourNombre: reserva.lugar_nombre || 'Tour EmiTours',
        fecha: reserva.fecha ? (reserva.fecha instanceof Date ? reserva.fecha.toISOString().split('T')[0] : String(reserva.fecha).substring(0, 10)) : 'N/A',
        hora: reserva.hora ? String(reserva.hora).substring(0, 5) : '08:00 AM',
        numeroPersonas: reserva.numero_personas || 1,
        precioTotal: totalCalc,
        montoPagado: pagadoCalc,
        saldoPendiente: saldoCalc,
        fechaCancelacion: fechaCancelacionStr
      });
      envioCorreoExitoso = Boolean(resMail?.exito);
    } catch (errMail) {
      console.error(`[Reserva Controller] ❌ Error no bloqueante al enviar correo de cancelación de reserva ${reserva.codigo || id}:`, errMail.message);
    }

    // 8. Responder con éxito
    return res.json({
      status: 'OK',
      mensaje: 'Reserva cancelada exitosamente. Ten presente que la cancelación no genera devolución del dinero pagado.',
      reservaId: id,
      estado: 'cancelada',
      notificacionAdminEnviada: envioCorreoExitoso
    });

  } catch (err) {
    console.error(`[Reserva Controller] ❌ Error al procesar cancelación de reserva #${id}:`, err);
    return res.status(500).json({
      status: 'ERROR',
      mensaje: 'Ocurrió un error interno al intentar cancelar la reserva. Por favor intenta más tarde.'
    });
  }
};