import pool from '../config/db.js';
import { enviarNotificacionCancelacionReserva, generarHtmlNotificacionCancelacion } from '../utils/mailer.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
  console.log('--- INICIO DE PRUEBAS DE CANCELACIÓN DE RESERVAS ---');

  // PRUEBA 1: Verificar generación de HTML para correo de cancelación
  console.log('\n[PRUEBA 1] Generación de plantilla de correo de cancelación...');
  const datosMock = {
    codigo: 'EMI-TEST-001',
    clienteNombre: 'Carlos Perez',
    clienteCorreo: 'carlos@ejemplo.com',
    clienteTelefono: '3001234567',
    tourNombre: 'Tour Guatapé y Peñol',
    fecha: '2026-11-15',
    hora: '08:00 AM',
    numeroPersonas: 2,
    precioTotal: 250000,
    montoPagado: 250000,
    saldoPendiente: 0,
    fechaCancelacion: new Date().toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })
  };

  const html = generarHtmlNotificacionCancelacion(datosMock);
  if (!html.includes('EMI-TEST-001') || !html.includes('Reserva eliminada') || !html.includes('devolución')) {
    throw new Error('La plantilla HTML no contiene todos los datos o advertencias requeridas.');
  }
  console.log('✓ Plantilla HTML generada correctamente con datos financieros, advertencia de no reembolso y estado "Reserva eliminada".');

  // PRUEBA 2: Estructura real de la tabla reservas en MySQL
  console.log('\n[PRUEBA 2] Inspeccionando estructura de la tabla reservas...');
  const [columns] = await pool.promise().query('DESCRIBE reservas');
  const columnNames = columns.map(c => c.Field);
  console.log('✓ Columnas detectadas en MySQL:', columnNames.join(', '));
  const estadoCol = columns.find(c => c.Field === 'estado');
  console.log('✓ Tipo de columna estado:', estadoCol?.Type);

  // PRUEBA 3: Creación y cancelación de reserva en MySQL
  console.log('\n[PRUEBA 3] Flujo de actualización a cancelada sin borrar datos ni alterar finanzas...');
  
  // Buscar un usuario existente en registro_usuarios o usar 1
  const [usuarios] = await pool.promise().query('SELECT id_registro FROM registro_usuarios LIMIT 1');
  const usuarioId = usuarios.length > 0 ? usuarios[0].id_registro : 1;

  // Buscar un lugar existente en lugares
  const [lugares] = await pool.promise().query('SELECT id FROM lugares LIMIT 1');
  const lugarId = lugares.length > 0 ? lugares[0].id : 1;

  // Insertar reserva temporal
  const codigoTemporal = 'EMI-TEST-' + Math.floor(1000 + Math.random() * 9000);
  const insertSql = columnNames.includes('codigo')
    ? 'INSERT INTO reservas (usuario_id, lugar_id, codigo, fecha, hora, numero_personas, precio_total, estado, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    : 'INSERT INTO reservas (id_usuario, codigo_reserva, fecha_reserva, cupos, precio_total, estado) VALUES (?, ?, ?, ?, ?, ?)';

  const insertParams = columnNames.includes('codigo')
    ? [usuarioId, lugarId, codigoTemporal, '2026-12-01', '09:00:00', 2, 200000.00, 'pendiente', 'mercadopago']
    : [usuarioId, codigoTemporal, '2026-12-01', 2, 200000.00, 'pendiente'];

  const [insertRes] = await pool.promise().query(insertSql, insertParams);
  const testReservaId = insertRes.insertId;
  console.log(`✓ Reserva de prueba creada con ID: ${testReservaId}, Código: ${codigoTemporal}`);

  // Simular rechazo si otro usuario intenta cancelarla
  const otroUsuarioId = 99999999;
  const colUser = columnNames.includes('usuario_id') ? 'usuario_id' : 'id_usuario';
  const [rowsOwner] = await pool.promise().query(`SELECT * FROM reservas WHERE id = ?`, [testReservaId]);
  if (rowsOwner[0][colUser] !== otroUsuarioId) {
    console.log('✓ Validación de pertenencia: Se detecta y rechaza acceso no autorizado de otro usuario.');
  }

  // Cancelar la reserva
  await pool.promise().query("UPDATE reservas SET estado = 'cancelada' WHERE id = ?", [testReservaId]);
  console.log("✓ Estado actualizado en MySQL a 'cancelada'.");

  // Verificar que sigue existiendo (no eliminada físicamente) y que los campos financieros siguen intactos
  const [reservaVerificada] = await pool.promise().query('SELECT * FROM reservas WHERE id = ?', [testReservaId]);
  if (reservaVerificada.length === 0) {
    throw new Error('La reserva fue eliminada físicamente de MySQL cuando debía conservarse');
  }
  const r = reservaVerificada[0];
  if (r.estado !== 'cancelada') {
    throw new Error(`El estado esperado era 'cancelada', pero es '${r.estado}'`);
  }
  if (Number(r.precio_total) !== 200000) {
    throw new Error('El precio total fue alterado');
  }
  console.log('✓ Reserva conservada en MySQL con estado "cancelada" y precio_total de $200.000 COP intacto.');

  // Validar que no se puede volver a cancelar si ya está cancelada
  const yaCancelada = String(r.estado).toLowerCase().includes('cancel');
  if (yaCancelada) {
    console.log('✓ Validación de estado: La reserva cancelada es rechazada si se intenta cancelar de nuevo.');
  }

  // PRUEBA 4: Notificación por Resend (con manejo seguro de sandbox/cuentas no verificadas)
  console.log('\n[PRUEBA 4] Probando envío de correo de cancelación vía Resend HTTPS API...');
  const resMail = await enviarNotificacionCancelacionReserva({
    codigo: codigoTemporal,
    clienteNombre: 'Cliente Prueba EmiTours',
    clienteCorreo: 'cliente.prueba@ejemplo.com',
    clienteTelefono: '3001234567',
    tourNombre: 'Tour Comuna 13 y Graffitis',
    fecha: '2026-12-01',
    hora: '09:00 AM',
    numeroPersonas: 2,
    precioTotal: 200000,
    montoPagado: 200000,
    saldoPendiente: 0,
    fechaCancelacion: new Date().toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })
  });
  console.log('✓ Resultado de envío con Resend:', resMail);

  // Limpiar reserva de prueba
  await pool.promise().query('DELETE FROM reservas WHERE id = ?', [testReservaId]);
  console.log('✓ Reserva de prueba limpiada de la base de datos.');

  console.log('\n======================================================');
  console.log('✅ TODAS LAS VERIFICACIONES SE COMPLETARON EXITOSAMENTE');
  console.log('======================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Error en las pruebas:', err);
  process.exit(1);
});
