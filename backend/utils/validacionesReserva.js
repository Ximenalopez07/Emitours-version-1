/**
 * Módulo de validación de reservas y conflictos de horarios para EmiTours
 * Incluye validación de horarios superpuestos y regla especial de día completo para Guatapé.
 */

// Duraciones catalogadas oficiales en horas para cada lugar/tour de EmiTours
const DURACIONES_TOURS_HORAS = {
  1: 4, // Pablo Escobar: 4 Horas
  2: 4, // Comuna 13: 4 Horas
  3: 8, // Guatapé: 8 Horas (excursión de día completo)
  4: 2, // Pueblito Paisa: 2 Horas
  5: 4, // City Tour: 4 Horas
  6: 3  // Metro Cable: 3 Horas
};

/**
 * Identifica de forma confiable si un tour corresponde a Guatapé
 * Prioriza el ID real en base de datos (ID 3) y apoya con el nombre normalizado oficial
 */
function esTourGuatape(lugarId, lugarNombre = '') {
  if (parseInt(lugarId, 10) === 3) return true;
  if (lugarNombre) {
    const norm = String(lugarNombre)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (norm === 'guatape' || norm.includes('guatape')) return true;
  }
  return false;
}

/**
 * Obtiene la duración en horas de un tour a partir de su ID o nombre de catálogo
 */
function obtenerDuracionTourHoras(lugarId, lugarNombre = '') {
  const idNum = parseInt(lugarId, 10);
  if (DURACIONES_TOURS_HORAS[idNum]) {
    return DURACIONES_TOURS_HORAS[idNum];
  }
  if (lugarNombre) {
    const norm = String(lugarNombre)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (norm.includes('guatape')) return 8;
    if (norm.includes('comuna 13')) return 4;
    if (norm.includes('metro cable')) return 3;
    if (norm.includes('pablo escobar')) return 4;
    if (norm.includes('pueblito paisa')) return 2;
    if (norm.includes('city tour')) return 4;
  }
  // Regla segura por defecto: 4 horas
  return 4;
}

/**
 * Convierte cualquier formato de hora (12h con AM/PM o 24h HH:MM:SS) a minutos desde la medianoche
 */
function horaAMinutos(horaStr) {
  if (!horaStr) return 7 * 60; // 07:00 AM por defecto
  const clean = String(horaStr).trim().toUpperCase();

  // Caso: Formato con AM o PM (ej: "07:30 AM", "01:00 PM")
  if (clean.includes('AM') || clean.includes('PM')) {
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const mAndPeriod = parts[1].trim().split(/\s+/);
    let m = parseInt(mAndPeriod[0], 10) || 0;
    const period = mAndPeriod[1] || (clean.endsWith('PM') ? 'PM' : 'AM');
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  // Caso: Formato militar 24h (HH:MM:SS o HH:MM)
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h * 60 + m;
  }

  return 7 * 60;
}

/**
 * Convierte minutos desde la medianoche a formato legible de 12 horas (ej: "07:00 AM", "11:00 AM", "01:30 PM")
 */
function minutosAHora12(minutos) {
  const minsVal = Math.max(0, parseInt(minutos, 10) || 0);
  const totalHoras = Math.floor(minsVal / 60);
  const h24 = totalHoras % 24;
  const m = minsVal % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Normaliza una fecha a cadena 'YYYY-MM-DD'
 */
function normalizarFecha(f) {
  if (!f) return '';
  if (typeof f === 'string') {
    const match = f.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  if (f instanceof Date) {
    if (!isNaN(f.getTime())) {
      return f.toISOString().split('T')[0];
    }
  }
  const str = String(f);
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return str.substring(0, 10);
}

/**
 * Convierte fecha y hora local de Colombia (America/Bogota, UTC-5) al timestamp UTC y calcula la hora exacta de finalización
 * Colombia es permanentemente UTC-05:00 sin horario de verano.
 * 
 * @param {string|Date} fecha - Fecha del tour (YYYY-MM-DD)
 * @param {string} hora - Hora de inicio (ej: "07:00 AM", "07:00:00", "09:00 AM")
 * @param {number} duracionHoras - Duración del tour en horas (ej: 4 para Comuna 13, 8 para Guatapé, 2 para Pueblito Paisa)
 * @returns {Object} { fechaFin, horaFin24, horaFin12, isoColombia, timestampFin }
 */
function calcularFinTourColombia(fecha, hora, duracionHoras = 4) {
  const fechaStr = normalizarFecha(fecha);
  if (!fechaStr) return null;

  const minutosInicio = horaAMinutos(hora);
  const duracionMins = Math.round(Number(duracionHoras) * 60);
  const totalMinutosFin = minutosInicio + duracionMins;

  // Extraer año, mes, día
  const [yearStr, monthStr, dayStr] = fechaStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  let day = parseInt(dayStr, 10);

  const diasExtra = Math.floor(totalMinutosFin / 1440);
  const minutosDiaFin = totalMinutosFin % 1440;

  const horaFin = Math.floor(minutosDiaFin / 60);
  const minFin = minutosDiaFin % 60;

  // Ajustar fecha en caso de cruzar medianoche
  if (diasExtra > 0) {
    const baseDate = new Date(Date.UTC(year, month - 1, day + diasExtra));
    year = baseDate.getUTCFullYear();
    month = baseDate.getUTCMonth() + 1;
    day = baseDate.getUTCDate();
  }

  const yStr = String(year).padStart(4, '0');
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  const hStr = String(horaFin).padStart(2, '0');
  const miStr = String(minFin).padStart(2, '0');

  // Formato ISO-8601 explícito con el huso horario de Colombia (-05:00)
  // Ej: "2026-10-30T11:00:00-05:00"
  const isoColombia = `${yStr}-${mStr}-${dStr}T${hStr}:${miStr}:00-05:00`;
  const timestampFin = new Date(isoColombia).getTime();

  return {
    fechaFin: `${yStr}-${mStr}-${dStr}`,
    horaFin24: `${hStr}:${miStr}:00`,
    horaFin12: minutosAHora12(minutosDiaFin),
    isoColombia,
    timestampFin
  };
}

/**
 * Obtiene la fecha y hora actuales en la zona horaria oficial de Colombia (America/Bogota)
 */
function getHoraActualColombia(dateObj = new Date()) {
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const partes = formateador.formatToParts(dateObj);
  const getPart = (type) => partes.find(p => p.type === type)?.value || '00';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return {
    fecha: `${year}-${month}-${day}`,
    hora: `${hour}:${minute}:${second}`,
    hora12: minutosAHora12(parseInt(hour, 10) * 60 + parseInt(minute, 10)),
    isoColombia: `${year}-${month}-${day}T${hour}:${minute}:${second}-05:00`,
    timestamp: dateObj.getTime()
  };
}

/**
 * Determina si una reserva ha superado su hora de finalización en Colombia
 * 
 * @param {Object} reserva - Objeto con fecha, hora, lugar_id o lugar_nombre
 * @param {number} [timestampActual] - Timestamp actual en milisegundos UTC (Date.now() por defecto)
 * @returns {boolean} true si el tour ya terminó en hora de Colombia, false en caso contrario
 */
function haFinalizadoTourColombia(reserva, timestampActual = Date.now()) {
  if (!reserva || !reserva.fecha || !reserva.hora) return false;
  const duracion = obtenerDuracionTourHoras(reserva.lugar_id, reserva.lugar_nombre);
  const fin = calcularFinTourColombia(reserva.fecha, reserva.hora, duracion);
  if (!fin || isNaN(fin.timestampFin)) return false;
  return timestampActual >= fin.timestampFin;
}

/**
 * Determina si dos intervalos de tiempo se superponen parcialmente o totalmente
 * Intervalo [inicioA, finA) e Intervalo [inicioB, finB)
 * Si inicioB >= finA o finB <= inicioA, no hay cruce.
 */
function seSuperponenHorarios(inicioA, finA, inicioB, finB) {
  return inicioA < finB && inicioB < finA;
}

/**
 * Función principal para validar conflictos de reservas de un usuario
 * 
 * @param {Object} params
 * @param {number|string} params.lugarId - ID del lugar a reservar
 * @param {string} [params.lugarNombre] - Nombre del tour a reservar
 * @param {string|Date} params.fecha - Fecha solicitada (YYYY-MM-DD)
 * @param {string} params.hora - Hora solicitada (ej: "07:00 AM" o "07:00:00")
 * @param {Array} params.reservasExistentes - Array de reservas existentes del usuario
 * @param {number|string} [params.reservaIdExcluir] - ID de reserva a excluir (por si es edición)
 * 
 * @returns {Object} { hayConflicto: boolean, tipo?: string, titulo?: string, mensaje?: string, detalles?: Object }
 */
function validarConflictoReserva({
  lugarId,
  lugarNombre = '',
  fecha,
  hora,
  reservasExistentes = [],
  reservaIdExcluir = null
}) {
  const fechaStr = normalizarFecha(fecha);
  if (!fechaStr) return { hayConflicto: false };

  // 1. Filtrar reservas activas del usuario para la misma fecha
  // - Solo bloquean: 'pendiente' y 'confirmada'
  // - NO bloquean: 'cancelada' (canceladas dejan de bloquear)
  // - NO bloquean: 'realizada'
  const activasDelDia = reservasExistentes.filter(r => {
    if (reservaIdExcluir && String(r.id) === String(reservaIdExcluir)) return false;
    const rFecha = normalizarFecha(r.fecha);
    if (rFecha !== fechaStr) return false;

    const est = String(r.estado || 'pendiente').toLowerCase();
    // Excluir canceladas y realizadas
    if (est.includes('cancel') || est.includes('realiz')) return false;

    // Solo considerar activas (pendiente o confirmada)
    return est.includes('pend') || est.includes('confir') || est.includes('activ');
  });

  if (activasDelDia.length === 0) {
    return { hayConflicto: false };
  }

  const esNuevoGuatape = esTourGuatape(lugarId, lugarNombre);

  // 2. REGLA ESPECIAL PARA GUATAPÉ (EXCURSIÓN DE DÍA COMPLETO)
  // Caso A: El usuario ya tiene una reserva activa de Guatapé en esta fecha
  const reservaGuatapeExistente = activasDelDia.find(r => esTourGuatape(r.lugar_id, r.lugar_nombre));
  if (reservaGuatapeExistente) {
    const inicioG = horaAMinutos(reservaGuatapeExistente.hora);
    return {
      hayConflicto: true,
      tipo: 'GUATAPE_EXISTENTE',
      titulo: '¡Guatapé ocupa todo el día!',
      mensaje: 'Como ya tienes una reserva de Guatapé para esta fecha, no puedes reservar otro tour el mismo día. Selecciona otra fecha para continuar.',
      detalles: {
        tour_existente: reservaGuatapeExistente.lugar_nombre || 'Guatapé',
        fecha: fechaStr,
        hora_inicio: minutosAHora12(inicioG),
        hora_fin: minutosAHora12(inicioG + 8 * 60)
      }
    };
  }

  // Caso B: El usuario intenta reservar Guatapé pero ya tiene otro tour activo ese día
  if (esNuevoGuatape && activasDelDia.length > 0) {
    const primerConflicto = activasDelDia[0];
    const duracionExistente = obtenerDuracionTourHoras(primerConflicto.lugar_id, primerConflicto.lugar_nombre);
    const inicioConflicto = horaAMinutos(primerConflicto.hora);
    return {
      hayConflicto: true,
      tipo: 'OTRO_TOUR_EXISTENTE',
      titulo: '¡Ya tienes otro tour reservado para este día!',
      mensaje: 'Guatapé es una excursión de día completo. Para reservarlo, debes elegir una fecha en la que no tengas otra reserva activa.',
      detalles: {
        tour_existente: primerConflicto.lugar_nombre || 'Tour registrado',
        fecha: fechaStr,
        hora_inicio: minutosAHora12(inicioConflicto),
        hora_fin: minutosAHora12(inicioConflicto + duracionExistente * 60)
      }
    };
  }

  // 3. VALIDACIÓN GENERAL DE HORARIOS SUPERPUESTOS
  // Si ninguno es Guatapé, se permiten múltiples tours en el mismo día SIEMPRE QUE NO SE CRUCEN
  const duracionNuevo = obtenerDuracionTourHoras(lugarId, lugarNombre);
  const inicioNuevo = horaAMinutos(hora);
  const finNuevo = inicioNuevo + duracionNuevo * 60;

  for (const r of activasDelDia) {
    const duracionR = obtenerDuracionTourHoras(r.lugar_id, r.lugar_nombre);
    const inicioR = horaAMinutos(r.hora);
    const finR = inicioR + duracionR * 60;

    if (seSuperponenHorarios(inicioNuevo, finNuevo, inicioR, finR)) {
      return {
        hayConflicto: true,
        tipo: 'HORARIO_SUPERPUESTO',
        titulo: '¡Ya tienes un tour reservado a esa hora!',
        mensaje: 'Ya tienes una reserva registrada para el día y la hora seleccionados. Para evitar que se crucen tus tours, elige otro horario disponible.',
        detalles: {
          tour_existente: r.lugar_nombre || 'Tour previo',
          fecha: fechaStr,
          hora_inicio: minutosAHora12(inicioR),
          hora_fin: minutosAHora12(finR),
          tour_solicitado: lugarNombre || 'Nuevo tour',
          hora_nueva_inicio: minutosAHora12(inicioNuevo),
          hora_nueva_fin: minutosAHora12(finNuevo)
        }
      };
    }
  }

  return { hayConflicto: false };
}

module.exports = {
  DURACIONES_TOURS_HORAS,
  esTourGuatape,
  obtenerDuracionTourHoras,
  horaAMinutos,
  minutosAHora12,
  normalizarFecha,
  seSuperponenHorarios,
  validarConflictoReserva,
  calcularFinTourColombia,
  getHoraActualColombia,
  haFinalizadoTourColombia
};
