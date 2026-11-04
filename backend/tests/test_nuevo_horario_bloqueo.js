/**
 * Batería de pruebas obligatorias: Nuevo Horario (7:00 AM - 4:00 PM)
 * y Bloqueo de Horas Pasadas para la fecha actual (Zona horaria Colombia: America/Bogota)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

const {
  validarHorarioPermitido,
  obtenerHorariosDisponiblesParaFecha,
  getHoraActualColombia,
  validarConflictoReserva,
  haFinalizadoTourColombia,
  calcularFinTourColombia,
  HORARIOS_OFICIALES
} = require('../utils/validacionesReserva');

let exitosas = 0;
let fallidas = 0;

function test(descripcion, fn) {
  try {
    fn();
    console.log(`  ✅ [PASÓ] ${descripcion}`);
    exitosas++;
  } catch (err) {
    console.error(`  ❌ [FALLÓ] ${descripcion}:`, err.message);
    fallidas++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 PRUEBAS OBLIGATORIAS: HORARIOS 7:00 AM - 4:00 PM Y BLOQUEO DE HORAS PASADAS');
  console.log('================================================================');

  // Supongamos fecha de prueba: "2026-11-10" (fecha futura)
  const fechaFutura = '2026-11-10';

  test('Prueba 1: Reservar a las 7:00 a. m. en fecha futura -> PERMITIDO', () => {
    const res = validarHorarioPermitido(fechaFutura, '07:00 AM');
    assert.strictEqual(res.esValido, true, '7:00 AM debe ser permitido');
  });

  test('Prueba 2: Reservar a las 4:00 p. m. en fecha futura -> PERMITIDO', () => {
    const res = validarHorarioPermitido(fechaFutura, '04:00 PM');
    assert.strictEqual(res.esValido, true, '4:00 PM debe ser permitido');
  });

  test('Prueba 3: Reservar antes de las 7:00 a. m. (ej: 06:30 AM) -> RECHAZADO', () => {
    const res = validarHorarioPermitido(fechaFutura, '06:30 AM');
    assert.strictEqual(res.esValido, false, '06:30 AM debe ser rechazado');
    assert.strictEqual(res.motivo, 'HORARIO_FUERA_RANGO');
  });

  test('Prueba 4: Reservar después de las 4:00 p. m. (ej: 04:30 PM, 05:00 PM, 07:00 PM) -> RECHAZADO', () => {
    const res430 = validarHorarioPermitido(fechaFutura, '04:30 PM');
    assert.strictEqual(res430.esValido, false);
    assert.strictEqual(res430.motivo, 'HORARIO_FUERA_RANGO');

    const res500 = validarHorarioPermitido(fechaFutura, '05:00 PM');
    assert.strictEqual(res500.esValido, false);

    const res700 = validarHorarioPermitido(fechaFutura, '07:00 PM');
    assert.strictEqual(res700.esValido, false);
  });

  // Simulación de fecha actual de Colombia a las 3:00 PM (15:00:00 hora de Colombia = 20:00:00 UTC)
  const hoySimulado = '2026-11-04';
  const timestamp3PMColombia = new Date('2026-11-04T15:00:00-05:00').getTime();

  test('Prueba 5: Si son las 3:00 p. m., reservar hoy a las 2:00 p. m. -> RECHAZADO', () => {
    const res = validarHorarioPermitido(hoySimulado, '02:00 PM', timestamp3PMColombia);
    assert.strictEqual(res.esValido, false, '2:00 PM ya pasó a las 3:00 PM');
    assert.strictEqual(res.motivo, 'HORA_PASADA');
  });

  test('Prueba 6: Si son las 3:00 p. m., reservar hoy exactamente a las 3:00 p. m. -> RECHAZADO (no se permite hora actual)', () => {
    const res = validarHorarioPermitido(hoySimulado, '03:00 PM', timestamp3PMColombia);
    assert.strictEqual(res.esValido, false, 'No se permite reservar exactamente a la hora actual');
    assert.strictEqual(res.motivo, 'HORA_PASADA');
  });

  test('Prueba 7: Si son las 3:00 p. m., reservar hoy a las 3:30 p. m. -> PERMITIDO', () => {
    const res = validarHorarioPermitido(hoySimulado, '03:30 PM', timestamp3PMColombia);
    assert.strictEqual(res.esValido, true, '3:30 PM es posterior a las 3:00 PM y dentro del rango');
  });

  test('Prueba 7b: Si son las 3:00 p. m., reservar hoy a las 4:00 p. m. -> PERMITIDO', () => {
    const res = validarHorarioPermitido(hoySimulado, '04:00 PM', timestamp3PMColombia);
    assert.strictEqual(res.esValido, true, '4:00 PM es posterior a las 3:00 PM y dentro del rango');
  });

  // Simulación de fecha actual a las 4:00 PM en punto (16:00:00) o más tarde (16:01:00)
  const timestamp4PMColombia = new Date('2026-11-04T16:00:00-05:00').getTime();
  const timestamp430PMColombia = new Date('2026-11-04T16:30:00-05:00').getTime();

  test('Prueba 8: Si son las 4:00 p. m. o más tarde, reservar ese mismo día -> RECHAZADO para todos los horarios', () => {
    const disponibles4PM = obtenerHorariosDisponiblesParaFecha(hoySimulado, timestamp4PMColombia);
    assert.strictEqual(disponibles4PM.length, 0, 'A las 4:00 PM no deben quedar horarios para hoy');

    const disponibles430PM = obtenerHorariosDisponiblesParaFecha(hoySimulado, timestamp430PMColombia);
    assert.strictEqual(disponibles430PM.length, 0, 'A las 4:30 PM no deben quedar horarios para hoy');

    const intento400 = validarHorarioPermitido(hoySimulado, '04:00 PM', timestamp4PMColombia);
    assert.strictEqual(intento400.esValido, false, '4:00 PM a las 4:00 PM debe rechazarse');
  });

  test('Prueba 9: Reservar una fecha futura entre las 7:00 a. m. y las 4:00 p. m. -> PERMITIDO (todos los 19 slots)', () => {
    const disponiblesFuturo = obtenerHorariosDisponiblesParaFecha(fechaFutura);
    assert.strictEqual(disponiblesFuturo.length, 19, 'Deben existir 19 slots entre 07:00 AM y 04:00 PM');
    assert.strictEqual(disponiblesFuturo[0], '07:00 AM');
    assert.strictEqual(disponiblesFuturo[disponiblesFuturo.length - 1], '04:00 PM');
  });

  test('Prueba 10: Reservar una fecha anterior al día actual de Colombia -> RECHAZADO', () => {
    const hoyReal = getHoraActualColombia().fecha;
    const resAyer = validarHorarioPermitido('2026-10-01', '08:00 AM');
    assert.strictEqual(resAyer.esValido, false);
    assert.strictEqual(resAyer.motivo, 'FECHA_PASADA');
  });

  test('Prueba 11: Solicitud con hora nula o formato inválido -> RECHAZADO', () => {
    const resVacia = validarHorarioPermitido('', '08:00 AM');
    assert.strictEqual(resVacia.esValido, false);
    assert.strictEqual(resVacia.motivo, 'FECHA_INVALIDA');
  });

  console.log('\n================================================================');
  console.log('🛡️ PRUEBAS DE NO-REGRESIÓN: CONFLICTOS, GUATAPÉ Y AUTO-REALIZADA');
  console.log('================================================================');

  test('Prueba 12: Guatapé sigue bloqueando todo el día para cualquier otro tour', () => {
    const reservaGuatape = {
      id: 501,
      lugar_id: 3,
      lugar_nombre: 'Guatapé',
      fecha: '2026-11-20',
      hora: '07:00 AM',
      estado: 'confirmada'
    };

    const intentoComuna13 = validarConflictoReserva({
      lugarId: 2,
      lugarNombre: 'Comuna 13',
      fecha: '2026-11-20',
      hora: '02:00 PM',
      reservasExistentes: [reservaGuatape]
    });

    assert.strictEqual(intentoComuna13.hayConflicto, true);
    assert.strictEqual(intentoComuna13.tipo, 'GUATAPE_EXISTENTE');
  });

  test('Prueba 13: Otros tours respetan horarios superpuestos sin cruces', () => {
    const reservaExistente = {
      id: 502,
      lugar_id: 2, // Comuna 13 (4h: 7:00 AM a 11:00 AM)
      lugar_nombre: 'Comuna 13',
      fecha: '2026-11-21',
      hora: '07:00 AM',
      estado: 'confirmada'
    };

    // Intento 1: Cruce a las 09:00 AM -> Bloqueado
    const cruce = validarConflictoReserva({
      lugarId: 4, // Pueblito Paisa
      lugarNombre: 'Pueblito Paisa',
      fecha: '2026-11-21',
      hora: '09:00 AM',
      reservasExistentes: [reservaExistente]
    });
    assert.strictEqual(cruce.hayConflicto, true);
    assert.strictEqual(cruce.tipo, 'HORARIO_SUPERPUESTO');

    // Intento 2: No cruce a las 11:00 AM (justo al terminar) -> Permitido
    const sinCruce = validarConflictoReserva({
      lugarId: 4,
      lugarNombre: 'Pueblito Paisa',
      fecha: '2026-11-21',
      hora: '11:00 AM',
      reservasExistentes: [reservaExistente]
    });
    assert.strictEqual(sinCruce.hayConflicto, false);
  });

  test('Prueba 14: Actualización automática a REALIZADA sigue calculando correctamente fin de tour', () => {
    // Comuna 13 a las 7:00 AM dura 4 horas -> termina 11:00 AM Colombia
    const fin = calcularFinTourColombia('2026-11-04', '07:00 AM', 4);
    assert.strictEqual(fin.horaFin12, '11:00 AM');
    assert.strictEqual(fin.isoColombia, '2026-11-04T11:00:00-05:00');

    // Comprobamos con timestamp de 10:59 AM Colombia -> false
    const ms1059 = new Date('2026-11-04T10:59:59-05:00').getTime();
    assert.strictEqual(haFinalizadoTourColombia({ fecha: '2026-11-04', hora: '07:00 AM', lugar_id: 2 }, ms1059), false);

    // Comprobamos con timestamp de 11:00 AM Colombia -> true
    const ms1100 = new Date('2026-11-04T11:00:00-05:00').getTime();
    assert.strictEqual(haFinalizadoTourColombia({ fecha: '2026-11-04', hora: '07:00 AM', lugar_id: 2 }, ms1100), true);
  });

  test('Prueba 15: Constantes de Mercado Pago y Resend intactas', () => {
    // Verificamos que las credenciales y SDK de Mercado Pago sigan operativos
    assert.ok(process.env.MERCADO_PAGO_ACCESS_TOKEN, 'Mercado Pago Token debe existir');
    assert.ok(process.env.RESEND_API_KEY, 'Resend API Key debe existir');
  });

  console.log('\n================================================================');
  console.log(`📊 RESULTADO DE LA EJECUCIÓN:`);
  console.log(`   Pruebas exitosas: ${exitosas}`);
  console.log(`   Pruebas fallidas: ${fallidas}`);
  console.log('================================================================');

  if (fallidas > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
