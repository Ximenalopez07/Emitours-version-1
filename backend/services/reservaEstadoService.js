const db = require('../config/db');
const { haFinalizadoTourColombia, calcularFinTourColombia } = require('../utils/validacionesReserva');

let cronTimer = null;
let ejecucionEnCurso = false;

/**
 * Consulta reservas en estado 'confirmada' cuyo horario de tour haya concluido
 * en la zona horaria oficial de Colombia (America/Bogota, UTC-5) y actualiza
 * su estado a 'realizada' en MySQL.
 * 
 * Reglas de integridad:
 * 1. Solo modifica reservas con estado = 'confirmada'.
 * 2. NO altera reservas con estado 'pendiente', 'cancelada' ni las ya 'realizada'.
 * 3. NO modifica pagos, montos pagados, saldos, ni métodos de pago.
 * 4. No realiza updates si no hay reservas finalizadas.
 * 
 * @param {Object} [poolParam] - Pool de base de datos opcional (por defecto pool de db.js)
 * @returns {Promise<{ actualizadas: number, ids: Array<number> }>}
 */
async function actualizarReservasFinalizadas(poolParam = db) {
  if (ejecucionEnCurso) {
    return { actualizadas: 0, saltado: true };
  }
  ejecucionEnCurso = true;

  try {
    const connPool = poolParam.promise ? poolParam.promise() : poolParam;

    // Solo consultar reservas con estado 'confirmada'
    const [rows] = await connPool.query(`
      SELECT 
        r.id, 
        r.codigo, 
        r.usuario_id,
        r.lugar_id, 
        r.fecha, 
        r.hora, 
        r.estado, 
        l.nombre as lugar_nombre
      FROM reservas r
      LEFT JOIN lugares l ON r.lugar_id = l.id
      WHERE r.estado = 'confirmada'
    `);

    if (!rows || rows.length === 0) {
      return { actualizadas: 0, ids: [] };
    }

    const ahoraMs = Date.now();
    const idsAFinalizar = [];

    for (const r of rows) {
      if (haFinalizadoTourColombia(r, ahoraMs)) {
        idsAFinalizar.push(r.id);
      }
    }

    if (idsAFinalizar.length > 0) {
      const [result] = await connPool.query(
        "UPDATE reservas SET estado = 'realizada' WHERE id IN (?) AND estado = 'confirmada'",
        [idsAFinalizar]
      );

      console.log(`[Reserva Estado Service] 🏁 ${result.affectedRows} reserva(s) confirmada(s) pasaron automáticamente a REALIZADA al finalizar su duración de tour.`);
      return { actualizadas: result.affectedRows, ids: idsAFinalizar };
    }

    return { actualizadas: 0, ids: [] };
  } catch (error) {
    console.error('[Reserva Estado Service] ❌ Error al actualizar reservas finalizadas:', error.message);
    return { actualizadas: 0, error: error.message };
  } finally {
    ejecucionEnCurso = false;
  }
}

/**
 * Inicia el temporizador periódico (Cron) compatible con Railway.
 * Se ejecuta en segundo plano durante todo el ciclo de vida del backend de Node.js.
 * 
 * @param {number} [intervaloMs=60000] - Intervalo de revisión en milisegundos (por defecto 1 minuto)
 */
function iniciarCronReservas(intervaloMs = 60000) {
  if (cronTimer) {
    return cronTimer;
  }

  console.log(`[Reserva Estado Service] ⏰ Cron periódico de reservas activado (cada ${intervaloMs / 1000}s, Zona: America/Bogota).`);

  // Ejecución inicial al levantar el servidor
  actualizarReservasFinalizadas().catch(err => {
    console.error('[Reserva Estado Service] Error en ciclo inicial:', err.message);
  });

  // Ciclo periódico
  cronTimer = setInterval(() => {
    actualizarReservasFinalizadas().catch(err => {
      console.error('[Reserva Estado Service] Error en ciclo periódico:', err.message);
    });
  }, intervaloMs);

  if (cronTimer && typeof cronTimer.unref === 'function') {
    cronTimer.unref();
  }

  return cronTimer;
}

/**
 * Detiene el temporizador periódico si es necesario (ej: en pruebas automatizadas)
 */
function detenerCronReservas() {
  if (cronTimer) {
    clearInterval(cronTimer);
    cronTimer = null;
    console.log('[Reserva Estado Service] ⏹️ Cron periódico de reservas detenido.');
  }
}

module.exports = {
  actualizarReservasFinalizadas,
  iniciarCronReservas,
  detenerCronReservas
};
