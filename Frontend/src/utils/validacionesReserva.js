/**
 * Módulo de validación de reservas y conflictos de horarios para EmiTours (Frontend React)
 * Incluye validación de horarios superpuestos y regla especial de día completo para Guatapé.
 */

export const DURACIONES_TOURS_HORAS = {
  1: 4, // Pablo Escobar: 4 Horas
  2: 4, // Comuna 13: 4 Horas
  3: 8, // Guatapé: 8 Horas (excursión de día completo)
  4: 2, // Pueblito Paisa: 2 Horas
  5: 4, // City Tour: 4 Horas
  6: 3  // Metro Cable: 3 Horas
};

export function esTourGuatape(lugarId, lugarNombre = '') {
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

export function obtenerDuracionTourHoras(lugarId, lugarNombre = '') {
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
  return 4;
}

export function horaAMinutos(horaStr) {
  if (!horaStr) return 7 * 60;
  const clean = String(horaStr).trim().toUpperCase();

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

  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h * 60 + m;
  }

  return 7 * 60;
}

export function minutosAHora12(minutos) {
  const minsVal = Math.max(0, parseInt(minutos, 10) || 0);
  const totalHoras = Math.floor(minsVal / 60);
  const h24 = totalHoras % 24;
  const m = minsVal % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function normalizarFecha(f) {
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
 */
export function calcularFinTourColombia(fecha, hora, duracionHoras = 4) {
  const fechaStr = normalizarFecha(fecha);
  if (!fechaStr) return null;

  const minutosInicio = horaAMinutos(hora);
  const duracionMins = Math.round(Number(duracionHoras) * 60);
  const totalMinutosFin = minutosInicio + duracionMins;

  const [yearStr, monthStr, dayStr] = fechaStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  let day = parseInt(dayStr, 10);

  const diasExtra = Math.floor(totalMinutosFin / 1440);
  const minutosDiaFin = totalMinutosFin % 1440;

  const horaFin = Math.floor(minutosDiaFin / 60);
  const minFin = minutosDiaFin % 60;

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
export function getHoraActualColombia(dateObj = new Date()) {
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
 */
export function haFinalizadoTourColombia(reserva, timestampActual = Date.now()) {
  if (!reserva || !reserva.fecha || !reserva.hora) return false;
  const duracion = obtenerDuracionTourHoras(reserva.lugar_id, reserva.lugar_nombre);
  const fin = calcularFinTourColombia(reserva.fecha, reserva.hora, duracion);
  if (!fin || isNaN(fin.timestampFin)) return false;
  return timestampActual >= fin.timestampFin;
}

export function seSuperponenHorarios(inicioA, finA, inicioB, finB) {
  return inicioA < finB && inicioB < finA;
}

export function validarConflictoReserva({
  lugarId,
  lugarNombre = '',
  fecha,
  hora,
  reservasExistentes = [],
  reservaIdExcluir = null
}) {
  const fechaStr = normalizarFecha(fecha);
  if (!fechaStr) return { hayConflicto: false };

  const activasDelDia = reservasExistentes.filter(r => {
    if (reservaIdExcluir && String(r.id) === String(reservaIdExcluir)) return false;
    const rFecha = normalizarFecha(r.fecha);
    if (rFecha !== fechaStr) return false;

    const est = String(r.estado || 'pendiente').toLowerCase();
    if (est.includes('cancel') || est.includes('realiz')) return false;

    return est.includes('pend') || est.includes('confir') || est.includes('activ');
  });

  if (activasDelDia.length === 0) {
    return { hayConflicto: false };
  }

  const esNuevoGuatape = esTourGuatape(lugarId, lugarNombre);

  // REGLA ESPECIAL GUATAPÉ (DÍA COMPLETO)
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

  // VALIDACIÓN GENERAL DE HORARIOS SUPERPUESTOS
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
