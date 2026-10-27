const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { enviarNotificacionNuevaReserva } = require('../utils/mailer');

async function testEmail() {
  console.log('====================================================');
  console.log('🧪 Diagnóstico de Envío de Notificaciones - Resend');
  console.log('====================================================');

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || '').trim();
  const emailFrom = (process.env.EMAIL_FROM || 'EmiTours <onboarding@resend.dev>').trim();

  const keyOculta = apiKey ? `SÍ (re_***${apiKey.slice(-4)})` : 'NO (Falta configurar RESEND_API_KEY en .env)';
  console.log(`- RESEND_API_KEY:               ${keyOculta}`);
  console.log(`- EMAIL_FROM configurado:       ${emailFrom}`);
  console.log(`- Destinatario Administrador:   ${adminEmail || 'NO DEFINIDO'}`);
  console.log('----------------------------------------------------');

  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY no tiene un valor asignado en .env.');
    console.warn('   Para probar el envío real, agrega tu clave en backend/.env o pásala por consola:');
    console.warn('   $env:RESEND_API_KEY="re_tu_clave_aqui"; node backend/tests/test_resend_email.js\n');
  }

  if (!adminEmail) {
    console.error('❌ Falta configurar ADMIN_NOTIFICATION_EMAIL en .env');
    process.exit(1);
  }

  console.log('Enviando notificación de prueba simulando una reserva...');

  const resultado = await enviarNotificacionNuevaReserva({
    codigo: 'RES-TEST-RESEND',
    clienteNombre: 'Usuario de Prueba EmiTours',
    clienteCorreo: 'prueba@ejemplo.com',
    clienteTelefono: '+57 300 123 4567',
    tourNombre: 'Guatapé y Piedra del Peñol (Prueba Resend)',
    fecha: new Date().toISOString().split('T')[0],
    hora: '08:00 AM',
    numeroPersonas: 2,
    idioma: 'Español',
    precioTotal: 500000,
    metodoPago: 'MERCADO PAGO (SANDBOX)',
    estadoReserva: 'confirmada',
    estadoPago: 'Pagado (100%)'
  });

  console.log('----------------------------------------------------');
  if (resultado.exito) {
    console.log(`✅ ¡Envío exitoso mediante Resend HTTPS!`);
    console.log(`- Message ID: ${resultado.messageId}`);
  } else {
    console.error(`❌ Estado del envío: ${resultado.error}`);
  }
  console.log('====================================================');
}

testEmail().catch(err => {
  console.error('Error no controlado:', err.message);
  process.exit(1);
});
