/**
 * Batería de pruebas automatizadas para la actualización automática de reservas al finalizar el tour
 * Sistema EmiTours - Zona horaria America/Bogota (UTC-5)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const {
  calcularFinTourColombia,
  haFinalizadoTourColombia,
  getHoraActualColombia,
  obtenerDuracionTourHoras,
  DURACIONES_TOURS_HORAS
} = require('../utils/validacionesReserva');
const {
  actualizarReservasFinalizadas,
  iniciarCronReservas,
  detenerCronReservas
} = require('../services/reservaEstadoService');

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
  console.log('🧪 PRUEBAS UNITARIAS: CÁLCULO DE FINALIZACIÓN Y HUSO HORARIO COLOMBIA');
  console.log('================================================================');

  test('Prueba 1: Comuna 13 (4h) inicia 7:00 AM y finaliza a las 11:00 AM de Colombia', () => {
    const fin = calcularFinTourColombia('2026-10-30', '07:00 AM', 4);
    assert.strictEqual(fin.fechaFin, '2026-10-30', 'La fecha debe coincidir');
    assert.strictEqual(fin.horaFin24, '11:00:00', 'Hora fin militar debe ser 11:00:00');
    assert.strictEqual(fin.horaFin12, '11:00 AM', 'Hora fin 12h debe ser 11:00 AM');
    assert.strictEqual(fin.isoColombia, '2026-10-30T11:00:00-05:00', 'Debe especificar el offset -05:00');

    // En UTC, 11:00:00 de Colombia (-05:00) corresponde exactamente a las 16:00:00 UTC
    const utcDate = new Date(fin.timestampFin);
    assert.strictEqual(utcDate.toISOString(), '2026-10-30T16:00:00.000Z', 'Equivalencia UTC estricta');
  });

  test('Prueba 2: Guatapé (8h) inicia 7:00 AM y finaliza a las 3:00 PM de Colombia', () => {
    const fin = calcularFinTourColombia('2026-10-30', '07:00 AM', 8);
    assert.strictEqual(fin.fechaFin, '2026-10-30');
    assert.strictEqual(fin.horaFin24, '15:00:00', 'Hora fin militar debe ser 15:00:00');
    assert.strictEqual(fin.horaFin12, '03:00 PM', 'Hora fin 12h debe ser 03:00 PM');
    assert.strictEqual(fin.isoColombia, '2026-10-30T15:00:00-05:00');

    // 15:00 Colombia (-05:00) = 20:00:00 UTC
    const utcDate = new Date(fin.timestampFin);
    assert.strictEqual(utcDate.toISOString(), '2026-10-30T20:00:00.000Z');
  });

  test('Prueba 3: Pueblito Paisa (2h) inicia 9:00 AM y finaliza a las 11:00 AM de Colombia', () => {
    const duracion = obtenerDuracionTourHoras(4, 'Pueblito Paisa');
    assert.strictEqual(duracion, 2, 'Duración catalogada de Pueblito Paisa debe ser 2 horas');
    const fin = calcularFinTourColombia('2026-10-30', '09:00 AM', duracion);
    assert.strictEqual(fin.horaFin24, '11:00:00');
    assert.strictEqual(fin.horaFin12, '11:00 AM');
    assert.strictEqual(fin.isoColombia, '2026-10-30T11:00:00-05:00');
  });

  test('Prueba 4: Comuna 13 permanece CONFIRMADA a las 10:59:59 AM y pasa a REALIZADA a las 11:00:00 AM', () => {
    const reserva = {
      lugar_id: 2, // Comuna 13
      lugar_nombre: 'Comuna 13',
      fecha: '2026-10-30',
      hora: '07:00 AM'
    };

    // 10:59:59 AM Colombia = 15:59:59 UTC
    const antesDeTerminarMs = new Date('2026-10-30T10:59:59-05:00').getTime();
    const finalizadoAntes = haFinalizadoTourColombia(reserva, antesDeTerminarMs);
    assert.strictEqual(finalizadoAntes, false, 'A las 10:59:59 AM NO debe marcarse como finalizada');

    // 11:00:00 AM Colombia = 16:00:00 UTC
    const horaExactaFinMs = new Date('2026-10-30T11:00:00-05:00').getTime();
    const finalizadoExacto = haFinalizadoTourColombia(reserva, horaExactaFinMs);
    assert.strictEqual(finalizadoExacto, true, 'A las 11:00:00 AM DEBE marcarse como finalizada');

    // 11:00:01 AM Colombia
    const unSegundoDespuesMs = new Date('2026-10-30T11:00:01-05:00').getTime();
    const finalizadoDespues = haFinalizadoTourColombia(reserva, unSegundoDespuesMs);
    assert.strictEqual(finalizadoDespues, true, 'A las 11:00:01 AM DEBE mantenerse como finalizada');
  });

  test('Prueba 5: Guatapé permanece CONFIRMADA a las 2:59:59 PM y pasa a REALIZADA a las 3:00:00 PM', () => {
    const reserva = {
      lugar_id: 3, // Guatapé (8 Horas)
      lugar_nombre: 'Guatapé',
      fecha: '2026-10-30',
      hora: '07:00 AM'
    };

    // 2:59:59 PM Colombia = 14:59:59 Colombia = 19:59:59 UTC
    const antesMs = new Date('2026-10-30T14:59:59-05:00').getTime();
    assert.strictEqual(haFinalizadoTourColombia(reserva, antesMs), false, 'A las 2:59:59 PM NO ha finalizado');

    // 3:00:00 PM Colombia = 15:00:00 Colombia = 20:00:00 UTC
    const finMs = new Date('2026-10-30T15:00:00-05:00').getTime();
    assert.strictEqual(haFinalizadoTourColombia(reserva, finMs), true, 'A las 3:00:00 PM YA ha finalizado');
  });

  test('Prueba 6: Una reserva futura conserva su estado y no finaliza prematuramente', () => {
    const reservaFutura = {
      lugar_id: 1, // Pablo Escobar
      lugar_nombre: 'Pablo Escobar',
      fecha: '2028-12-01',
      hora: '08:00 AM'
    };
    const ahora = Date.now();
    assert.strictEqual(haFinalizadoTourColombia(reservaFutura, ahora), false, 'Tour futuro no puede estar finalizado');
  });

  test('Prueba 7: Invariabilidad del cálculo con servidor en UTC (simulación entorno Railway)', () => {
    // En Railway el servidor trabaja en UTC puro.
    // Verificamos que al comparar Date.now() en UTC con el timestamp UTC de Colombia,
    // la diferencia sea matemáticamente idéntica y no sufra desfasajes.
    const reserva = {
      lugar_id: 2,
      fecha: '2026-10-30',
      hora: '07:00:00'
    };
    const fin = calcularFinTourColombia(reserva.fecha, reserva.hora, 4);

    // Mockeamos timestamp de servidor Railway en UTC: 2026-10-30T15:30:00.000Z (corresponde a 10:30 AM Colombia)
    const mockRailwayServerUtc_10_30 = new Date('2026-10-30T15:30:00.000Z').getTime();
    assert.strictEqual(haFinalizadoTourColombia(reserva, mockRailwayServerUtc_10_30), false, 'En UTC 15:30 (10:30 Col) aún no termina');

    // Mockeamos timestamp de servidor Railway en UTC: 2026-10-30T16:00:00.000Z (corresponde a 11:00 AM Colombia)
    const mockRailwayServerUtc_11_00 = new Date('2026-10-30T16:00:00.000Z').getTime();
    assert.strictEqual(haFinalizadoTourColombia(reserva, mockRailwayServerUtc_11_00), true, 'En UTC 16:00 (11:00 Col) ya finalizó');
  });

  console.log('\n================================================================');
  console.log('🧪 PRUEBAS DE INTEGRACIÓN: REGLAS DE NEGOCIO Y BASE DE DATOS (MOCK / POOL)');
  console.log('================================================================');

  test('Prueba 8: Reglas de estado - Solo reservas confirmadas pasan a realizada (Pendiente y Cancelada se ignoran)', async () => {
    const mockReservas = [
      { id: 101, codigo: 'RES-101', fecha: '2026-10-20', hora: '07:00 AM', lugar_id: 2, estado: 'confirmada', lugar_nombre: 'Comuna 13' },
      { id: 102, codigo: 'RES-102', fecha: '2026-10-20', hora: '07:00 AM', lugar_id: 2, estado: 'pendiente', lugar_nombre: 'Comuna 13' }, // PENDIENTE: NO DEBE CAMBIAR
      { id: 103, codigo: 'RES-103', fecha: '2026-10-20', hora: '07:00 AM', lugar_id: 2, estado: 'cancelada', lugar_nombre: 'Comuna 13' }, // CANCELADA: NUNCA DEBE CAMBIAR
      { id: 104, codigo: 'RES-104', fecha: '2030-10-20', hora: '07:00 AM', lugar_id: 2, estado: 'confirmada', lugar_nombre: 'Comuna 13' }  // FUTURA: NO DEBE CAMBIAR
    ];

    let updateEjecutado = null;

    const mockPool = {
      promise: () => ({
        query: async (sql, params) => {
          if (sql.includes('SELECT') && sql.includes("WHERE r.estado = 'confirmada'")) {
            // El servicio filtra explícitamente solo las confirmadas en la consulta SQL
            const filtradas = mockReservas.filter(r => r.estado === 'confirmada');
            return [filtradas];
          }
          if (sql.includes('UPDATE reservas SET estado = \'realizada\'')) {
            updateEjecutado = params[0];
            return [{ affectedRows: params[0].length }];
          }
          return [[]];
        }
      })
    };

    const res = await actualizarReservasFinalizadas(mockPool);
    assert.strictEqual(res.actualizadas, 1, 'Solo 1 reserva debe haberse actualizado');
    assert.deepStrictEqual(updateEjecutado, [101], 'Solo la reserva confirmada pasada (ID 101) debió actualizarse');
    assert.ok(!updateEjecutado.includes(102), 'Reserva pendiente no debe actualizarse');
    assert.ok(!updateEjecutado.includes(103), 'Reserva cancelada no debe actualizarse');
    assert.ok(!updateEjecutado.includes(104), 'Reserva futura no debe actualizarse');
  });

  test('Prueba 9: Integridad de datos - No se tocan montos, pagos ni métodos de pago', async () => {
    const mockReservaFin = {
      id: 201,
      codigo: 'RES-201',
      fecha: '2026-10-01',
      hora: '07:00:00',
      lugar_id: 3, // Guatapé
      estado: 'confirmada',
      precio_total: 250000,
      monto_pagado: 125000,
      metodo_pago: 'mercadopago',
      estado_pago: 'parcial'
    };

    let sqlEjecutado = '';
    const mockPool = {
      promise: () => ({
        query: async (sql, params) => {
          if (sql.includes('SELECT')) {
            return [[mockReservaFin]];
          }
          if (sql.includes('UPDATE')) {
            sqlEjecutado = sql;
            return [{ affectedRows: 1 }];
          }
          return [[]];
        }
      })
    };

    await actualizarReservasFinalizadas(mockPool);
    // Verificar que el UPDATE solo actualiza el estado y no toca campos de dinero
    assert.ok(sqlEjecutado.includes("UPDATE reservas SET estado = 'realizada' WHERE id IN (?) AND estado = 'confirmada'"));
    assert.ok(!sqlEjecutado.includes('monto_pagado'), 'No debe alterar monto_pagado');
    assert.ok(!sqlEjecutado.includes('precio_total'), 'No debe alterar precio_total');
    assert.ok(!sqlEjecutado.includes('estado_pago'), 'No debe alterar estado_pago');
    assert.ok(!sqlEjecutado.includes('metodo_pago'), 'No debe alterar metodo_pago');
  });

  test('Prueba 10: Iniciar y detener cron periódico sin fugas de temporizador', () => {
    const timer = iniciarCronReservas(60000);
    assert.ok(timer, 'Cron debe iniciar exitosamente');
    detenerCronReservas();
    assert.strictEqual(detenerCronReservas(), undefined, 'Cron debe detenerse limpiamente');
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
