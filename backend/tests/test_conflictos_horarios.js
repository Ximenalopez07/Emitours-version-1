const {
  validarConflictoReserva,
  esTourGuatape,
  obtenerDuracionTourHoras,
  horaAMinutos,
  minutosAHora12,
  seSuperponenHorarios
} = require('../utils/validacionesReserva');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ LA ASERCIÓN: ${message}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  SUITE DE PRUEBAS: VALIDACIÓN DE HORARIOS Y REGLA DE GUATAPÉ  ');
  console.log('===============================================================\n');

  // CASO 1: Reservar dos tours a la misma hora y fecha (mismo lugar) -> Bloqueado
  console.log('PRUEBA 1: Reservar dos tours a la misma hora y fecha...');
  const resExistentes1 = [
    { id: 101, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-20', hora: '07:00 AM', estado: 'confirmada' }
  ];
  const resultado1 = validarConflictoReserva({
    lugarId: 2,
    lugarNombre: 'Comuna 13',
    fecha: '2026-11-20',
    hora: '07:00 AM',
    reservasExistentes: resExistentes1
  });
  assert(resultado1.hayConflicto === true, 'Debe detectar conflicto a la misma hora y fecha');
  assert(resultado1.tipo === 'HORARIO_SUPERPUESTO', 'El tipo de conflicto debe ser HORARIO_SUPERPUESTO');
  assert(resultado1.titulo === '¡Ya tienes un tour reservado a esa hora!', 'Título correcto');
  console.log('✓ Correcto: Bloqueada segunda reserva a la misma hora y fecha.\n');

  // CASO 2: Reservar otro lugar a la misma hora -> Bloqueado
  console.log('PRUEBA 2: Reservar otro lugar a la misma hora y fecha...');
  const resExistentes2 = [
    { id: 102, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-20', hora: '08:00 AM', estado: 'confirmada' }
  ];
  const resultado2 = validarConflictoReserva({
    lugarId: 6,
    lugarNombre: 'Metro Cable',
    fecha: '2026-11-20',
    hora: '08:00 AM',
    reservasExistentes: resExistentes2
  });
  assert(resultado2.hayConflicto === true, 'Debe bloquearse aunque sea otro destino a la misma hora');
  console.log('✓ Correcto: Bloqueada reserva de otro destino a la misma hora.\n');

  // CASO 3: Reservar un tour que se superpone parcialmente con otro -> Bloqueado
  // Comuna 13 (duración: 4 horas) de 07:00 AM a 11:00 AM. Se intenta reservar Pueblito Paisa a las 09:00 AM
  console.log('PRUEBA 3: Reservar un tour que se superpone parcialmente...');
  const resExistentes3 = [
    { id: 103, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-20', hora: '07:00:00', estado: 'confirmada' }
  ];
  const resultado3 = validarConflictoReserva({
    lugarId: 4,
    lugarNombre: 'Pueblito Paisa',
    fecha: '2026-11-20',
    hora: '09:00 AM',
    reservasExistentes: resExistentes3
  });
  assert(resultado3.hayConflicto === true, 'Debe detectar superposición parcial de 09:00 dentro de 07:00-11:00');
  assert(resultado3.detalles.hora_inicio === '07:00 AM', 'Hora de inicio detectada');
  assert(resultado3.detalles.hora_fin === '11:00 AM', 'Hora de fin calculada correctamente (7h + 4h = 11h)');
  console.log(`✓ Correcto: Superposición parcial detectada (existente: ${resultado3.detalles.hora_inicio} a ${resultado3.detalles.hora_fin}, nueva: ${resultado3.detalles.hora_nueva_inicio} a ${resultado3.detalles.hora_nueva_fin}).\n`);

  // CASO 4: Reservar otro tour después de que termine el anterior -> Permitido
  // Comuna 13 de 07:00 AM a 11:00 AM. Se intenta reservar Pueblito Paisa a las 11:00 AM o después
  console.log('PRUEBA 4: Reservar otro tour después de que termine el anterior...');
  const resExistentes4 = [
    { id: 104, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-20', hora: '07:00:00', estado: 'confirmada' }
  ];
  const resultado4 = validarConflictoReserva({
    lugarId: 4,
    lugarNombre: 'Pueblito Paisa',
    fecha: '2026-11-20',
    hora: '11:00 AM', // Comienza exactamente cuando termina Comuna 13
    reservasExistentes: resExistentes4
  });
  assert(resultado4.hayConflicto === false, 'Debe permitirse tour adyacente que comience al terminar el anterior');
  console.log('✓ Correcto: Permitido tour inmediatamente adyacente (11:00 AM tras finalizar a las 11:00 AM).\n');

  // CASO 5: Reservar en una fecha diferente -> Permitido
  console.log('PRUEBA 5: Reservar en una fecha diferente...');
  const resExistentes5 = [
    { id: 105, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-20', hora: '07:00 AM', estado: 'confirmada' }
  ];
  const resultado5 = validarConflictoReserva({
    lugarId: 2,
    lugarNombre: 'Comuna 13',
    fecha: '2026-11-21',
    hora: '07:00 AM',
    reservasExistentes: resExistentes5
  });
  assert(resultado5.hayConflicto === false, 'Debe permitirse reservar en una fecha diferente sin conflictos');
  console.log('✓ Correcto: Permitido reservar en fecha distinta sin cruces.\n');

  // CASO 6: Tener una reserva cancelada e intentar reservar en ese mismo horario -> Permitido
  console.log('PRUEBA 6: Horario liberado si la reserva previa está cancelada...');
  const resExistentes6 = [
    { id: 106, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-20', hora: '07:00 AM', estado: 'cancelada' }
  ];
  const resultado6 = validarConflictoReserva({
    lugarId: 2,
    lugarNombre: 'Comuna 13',
    fecha: '2026-11-20',
    hora: '07:00 AM',
    reservasExistentes: resExistentes6
  });
  assert(resultado6.hayConflicto === false, 'Una reserva cancelada NO debe bloquear horarios');
  console.log('✓ Correcto: La reserva cancelada no bloquea el horario.\n');

  // CASO 7: Tener una reserva realizada -> No bloquea horarios futuros innecesariamente
  console.log('PRUEBA 7: Reserva realizada no bloquea...');
  const resExistentes7 = [
    { id: 107, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-20', hora: '07:00 AM', estado: 'realizada' }
  ];
  const resultado7 = validarConflictoReserva({
    lugarId: 4,
    lugarNombre: 'Pueblito Paisa',
    fecha: '2026-11-20',
    hora: '08:00 AM',
    reservasExistentes: resExistentes7
  });
  assert(resultado7.hayConflicto === false, 'Una reserva realizada no debe bloquear indebidamente');
  console.log('✓ Correcto: Reserva realizada no bloquea.\n');

  // CASO 8: Reservar Guatapé y después intentar reservar cualquier otro destino el mismo día -> Bloqueado
  console.log('PRUEBA 8: Guatapé ya reservado -> Bloquea cualquier otro destino ese día...');
  const resExistentes8 = [
    { id: 108, lugar_id: 3, lugar_nombre: 'Guatapé', fecha: '2026-11-15', hora: '08:00 AM', estado: 'confirmada' }
  ];
  const resultado8 = validarConflictoReserva({
    lugarId: 2,
    lugarNombre: 'Comuna 13',
    fecha: '2026-11-15',
    hora: '03:00 PM', // Aunque sea por la tarde
    reservasExistentes: resExistentes8
  });
  assert(resultado8.hayConflicto === true, 'Guatapé debe bloquear todo el día');
  assert(resultado8.tipo === 'GUATAPE_EXISTENTE', 'Tipo GUATAPE_EXISTENTE');
  assert(resultado8.titulo === '¡Guatapé ocupa todo el día!', 'Título debe ser ¡Guatapé ocupa todo el día!');
  assert(resultado8.mensaje.includes('Como ya tienes una reserva de Guatapé para esta fecha'), 'Mensaje exacto');
  console.log(`✓ Correcto: ${resultado8.titulo} -> ${resultado8.mensaje}\n`);

  // CASO 9: Reservar otro destino y después intentar reservar Guatapé el mismo día -> Bloqueado
  console.log('PRUEBA 9: Otro tour ya reservado -> Bloquea reservar Guatapé ese mismo día...');
  const resExistentes9 = [
    { id: 109, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-15', hora: '07:00 AM', estado: 'pendiente' }
  ];
  const resultado9 = validarConflictoReserva({
    lugarId: 3,
    lugarNombre: 'Guatapé',
    fecha: '2026-11-15',
    hora: '01:00 PM',
    reservasExistentes: resExistentes9
  });
  assert(resultado9.hayConflicto === true, 'No se puede reservar Guatapé si ya hay otro tour');
  assert(resultado9.tipo === 'OTRO_TOUR_EXISTENTE', 'Tipo OTRO_TOUR_EXISTENTE');
  assert(resultado9.titulo === '¡Ya tienes otro tour reservado para este día!', 'Título exacto');
  assert(resultado9.mensaje.includes('Guatapé es una excursión de día completo'), 'Mensaje exacto');
  console.log(`✓ Correcto: ${resultado9.titulo} -> ${resultado9.mensaje}\n`);

  // CASO 10: Intentar reservar Guatapé dos veces el mismo día -> Bloqueado
  console.log('PRUEBA 10: Intentar reservar Guatapé dos veces el mismo día...');
  const resExistentes10 = [
    { id: 110, lugar_id: 3, lugar_nombre: 'Guatapé', fecha: '2026-11-15', hora: '07:00 AM', estado: 'confirmada' }
  ];
  const resultado10 = validarConflictoReserva({
    lugarId: 3,
    lugarNombre: 'Guatapé',
    fecha: '2026-11-15',
    hora: '10:00 AM',
    reservasExistentes: resExistentes10
  });
  assert(resultado10.hayConflicto === true, 'No se permite duplicar Guatapé el mismo día');
  assert(resultado10.titulo === '¡Guatapé ocupa todo el día!', 'Título exacto');
  console.log('✓ Correcto: Bloqueada segunda reserva de Guatapé el mismo día.\n');

  // CASO 11: Cancelar una reserva de Guatapé e intentar reservar otro destino ese día -> Permitido
  console.log('PRUEBA 11: Guatapé cancelado permite reservar otro destino ese día...');
  const resExistentes11 = [
    { id: 111, lugar_id: 3, lugar_nombre: 'Guatapé', fecha: '2026-11-15', hora: '07:00 AM', estado: 'cancelada' }
  ];
  const resultado11 = validarConflictoReserva({
    lugarId: 2,
    lugarNombre: 'Comuna 13',
    fecha: '2026-11-15',
    hora: '09:00 AM',
    reservasExistentes: resExistentes11
  });
  assert(resultado11.hayConflicto === false, 'Si Guatapé fue cancelado, el día queda libre');
  console.log('✓ Correcto: Día liberado tras cancelar Guatapé.\n');

  // CASO 12: Identificación confiable de Guatapé por ID real 3
  console.log('PRUEBA 12: Identificación confiable de Guatapé mediante ID real...');
  assert(esTourGuatape(3) === true, 'ID 3 debe ser Guatapé');
  assert(esTourGuatape('3') === true, 'ID "3" en string debe ser Guatapé');
  assert(esTourGuatape(99, 'Tour Guatapé y Peñol') === true, 'Nombre con Guatapé debe reconocerse');
  assert(esTourGuatape(2, 'Comuna 13') === false, 'Comuna 13 no es Guatapé');
  console.log('✓ Correcto: Guatapé identificado de forma robusta por ID 3 y catálogo.\n');

  // CASO 13: Cálculo de duraciones catalogadas
  console.log('PRUEBA 13: Verificación de duraciones catalogadas oficiales...');
  assert(obtenerDuracionTourHoras(1) === 4, 'Pablo Escobar: 4h');
  assert(obtenerDuracionTourHoras(2) === 4, 'Comuna 13: 4h');
  assert(obtenerDuracionTourHoras(3) === 8, 'Guatapé: 8h');
  assert(obtenerDuracionTourHoras(4) === 2, 'Pueblito Paisa: 2h');
  assert(obtenerDuracionTourHoras(5) === 4, 'City Tour: 4h');
  assert(obtenerDuracionTourHoras(6) === 3, 'Metro Cable: 3h');
  console.log('✓ Correcto: Duraciones catalogadas coinciden 100% con las especificaciones.\n');

  // CASO 14: Simulación de múltiples tours en el mismo día (Comuna 13 + Santa Fe / Metro Cable)
  console.log('PRUEBA 14: Múltiples tours en un mismo día sin cruce de horarios...');
  // Tour 1: Comuna 13 (4h) de 07:00 AM a 11:00 AM
  // Tour 2: Pueblito Paisa (2h) de 11:30 AM a 01:30 PM (13:30)
  // Tour 3: Metro Cable (3h) de 02:00 PM (14:00) a 05:00 PM (17:00)
  const misReservasDia = [
    { id: 201, lugar_id: 2, lugar_nombre: 'Comuna 13', fecha: '2026-11-25', hora: '07:00 AM', estado: 'confirmada' },
    { id: 202, lugar_id: 4, lugar_nombre: 'Pueblito Paisa', fecha: '2026-11-25', hora: '11:30 AM', estado: 'confirmada' }
  ];
  // Intentar agregar Tour 3 a las 02:00 PM
  const resMultiValido = validarConflictoReserva({
    lugarId: 6,
    lugarNombre: 'Metro Cable',
    fecha: '2026-11-25',
    hora: '02:00 PM',
    reservasExistentes: misReservasDia
  });
  assert(resMultiValido.hayConflicto === false, 'Debe permitir tercer tour si no se cruza');

  // Intentar agregar Tour con cruce (a la 01:00 PM cuando Pueblito Paisa termina a la 01:30 PM)
  const resMultiInvalido = validarConflictoReserva({
    lugarId: 6,
    lugarNombre: 'Metro Cable',
    fecha: '2026-11-25',
    hora: '01:00 PM',
    reservasExistentes: misReservasDia
  });
  assert(resMultiInvalido.hayConflicto === true, 'Debe bloquear cruce a la 01:00 PM con Pueblito Paisa que termina a la 01:30 PM');
  console.log('✓ Correcto: Varios tours permitidos si no se cruzan, bloqueados si se solapan.\n');

  // CASO 15: Integridad de datos y ausencia de efectos colaterales
  console.log('PRUEBA 15: Verificación de no alteración de pagos ni estado...');
  const reservaPrevia = {
    id: 999,
    lugar_id: 2,
    lugar_nombre: 'Comuna 13',
    fecha: '2026-11-20',
    hora: '07:00 AM',
    estado: 'confirmada',
    monto_pagado: 100000,
    precio_total: 100000,
    estado_pago: 'pagado'
  };
  const copiaPrevia = JSON.stringify(reservaPrevia);
  validarConflictoReserva({
    lugarId: 2,
    lugarNombre: 'Comuna 13',
    fecha: '2026-11-20',
    hora: '07:00 AM',
    reservasExistentes: [reservaPrevia]
  });
  assert(JSON.stringify(reservaPrevia) === copiaPrevia, 'El objeto de reserva previa debe permanecer 100% inmutable');
  console.log('✓ Correcto: Ningún campo de pago o reserva previa es alterado.\n');

  console.log('===============================================================');
  console.log('  ✅ TODAS LAS 15 PRUEBAS OBLIGATORIAS PASARON CON ÉXITO');
  console.log('===============================================================\n');
}

runTests().catch(err => {
  console.error('Error durante la ejecución de pruebas:', err);
  process.exit(1);
});
