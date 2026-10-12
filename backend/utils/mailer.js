const nodemailer = require('nodemailer');
require('dotenv').config();

let cachedTransporter = null;

/**
 * Obtener o inicializar el transporte SMTP configurado en .env
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // 1. Configuración SMTP estándar especificada en .env
  if (host && user && pass) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    return cachedTransporter;
  }

  // 2. Compatibilidad si se definieron variables legacy EMAIL_USER y EMAIL_PASS
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    return cachedTransporter;
  }

  // 3. Fallback de desarrollo con cuenta de prueba Ethereal si no hay credenciales en .env
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[Mailer] Modo de prueba activo (Ethereal test account)');
    return cachedTransporter;
  } catch (err) {
    console.error('[Mailer] No se pudo inicializar transporte de correo:', err.message);
    throw new Error('Servicio de correo no disponible.');
  }
}

/**
 * Verificar conectividad con el servidor SMTP
 */
async function verificarConexionSMTP() {
  try {
    const mailer = await getTransporter();
    await mailer.verify();
    return { ok: true, mensaje: 'Conexión SMTP verificada exitosamente.' };
  } catch (error) {
    return { ok: false, mensaje: error.message };
  }
}

/**
 * Enviar correo genérico
 */
async function enviarCorreo({ destinatario, asunto, texto, html }) {
  try {
    const mailer = await getTransporter();
    const remitente = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || '"EmiTours" <no-reply@emitours.com>';

    const info = await mailer.sendMail({
      from: remitente,
      to: destinatario,
      subject: asunto,
      text: texto,
      html: html || `<p>${texto}</p>`
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Mailer Correo Enviado] Vista previa: ${previewUrl}`);
    }

    return { exito: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Mailer] Error enviando correo a ${destinatario}:`, error.message);
    return { exito: false, error: error.message };
  }
}

/**
 * Plantilla HTML profesional para notificación de nueva reserva
 */
function generarHtmlNotificacionReserva(datos) {
  const {
    codigo,
    clienteNombre,
    clienteCorreo,
    clienteTelefono,
    tourNombre,
    fecha,
    hora,
    numeroPersonas,
    idioma,
    precioTotal,
    metodoPago,
    estadoReserva,
    estadoPago
  } = datos;

  const precioFormateado = Number(precioTotal || 0).toLocaleString('es-CO');
  const fechaActual = new Date().toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 8px 0 0; font-size: 15px; opacity: 0.95; font-weight: 400; }
        .content { padding: 32px 28px; }
        .badge-code { background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 10px; padding: 14px 20px; text-align: center; margin-bottom: 26px; }
        .badge-code span { display: block; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .badge-code strong { font-family: monospace; font-size: 26px; color: #0284c7; letter-spacing: 2px; }
        .section-title { font-size: 15px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.8px; margin: 20px 0 10px; border-bottom: 2px solid #e0f2fe; padding-bottom: 6px; }
        .table-details { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .table-details td { padding: 10px 8px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
        .table-details td.label { font-weight: 600; color: #475569; width: 42%; }
        .table-details td.value { font-weight: 700; color: #0f172a; }
        .pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .pill-success { background: #dcfce7; color: #15803d; }
        .pill-pending { background: #fef3c7; color: #b45309; }
        .pill-info { background: #e0f2fe; color: #0369a1; }
        .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- ENCABEZADO -->
        <div class="header">
          <h1>EmiTours</h1>
          <p>🔔 ¡Nueva reserva recibida en el sistema!</p>
        </div>

        <!-- CUERPO -->
        <div class="content">
          <!-- CÓDIGO DESTACADO -->
          <div class="badge-code">
            <span>Código de la Reserva</span>
            <strong>${codigo}</strong>
          </div>

          <!-- DETALLES DEL CLIENTE -->
          <div class="section-title">👤 Datos del Cliente</div>
          <table class="table-details">
            <tr>
              <td class="label">Nombre del cliente:</td>
              <td class="value">${clienteNombre || 'No especificado'}</td>
            </tr>
            <tr>
              <td class="label">Correo electrónico:</td>
              <td class="value">${clienteCorreo || 'No especificado'}</td>
            </tr>
            <tr>
              <td class="label">Teléfono / WhatsApp:</td>
              <td class="value">${clienteTelefono || 'No especificado'}</td>
            </tr>
          </table>

          <!-- DETALLES DEL TOUR -->
          <div class="section-title">🏔️ Información del Tour</div>
          <table class="table-details">
            <tr>
              <td class="label">Lugar / Tour reservado:</td>
              <td class="value" style="color: #0284c7; font-size: 15px;">${tourNombre}</td>
            </tr>
            <tr>
              <td class="label">Fecha del tour:</td>
              <td class="value">${fecha}</td>
            </tr>
            <tr>
              <td class="label">Hora seleccionada:</td>
              <td class="value">${hora}</td>
            </tr>
            <tr>
              <td class="label">Número de personas:</td>
              <td class="value">${numeroPersonas} persona(s)</td>
            </tr>
            <tr>
              <td class="label">Idioma del tour:</td>
              <td class="value"><span class="pill pill-info">${idioma}</span></td>
            </tr>
          </table>

          <!-- DETALLES DEL PAGO -->
          <div class="section-title">💳 Detalles del Pago</div>
          <table class="table-details">
            <tr>
              <td class="label">Precio total:</td>
              <td class="value" style="font-size: 16px; color: #0284c7;">$${precioFormateado} COP</td>
            </tr>
            <tr>
              <td class="label">Método de pago:</td>
              <td class="value">${metodoPago}</td>
            </tr>
            <tr>
              <td class="label">Estado de la reserva:</td>
              <td class="value"><span class="pill pill-pending">${(estadoReserva || 'Pendiente').toUpperCase()}</span></td>
            </tr>
            <tr>
              <td class="label">Estado del pago:</td>
              <td class="value"><span class="pill pill-success">${(estadoPago || 'Pendiente').toUpperCase()}</span></td>
            </tr>
          </table>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p style="margin: 0 0 6px;">Notificación automática generada por <strong>EmiTours</strong> el ${fechaActual}.</p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">Por favor gestiona esta reserva en el panel de administración oficial.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Enviar notificación al administrador cuando se crea una nueva reserva
 */
async function enviarNotificacionNuevaReserva(datos) {
  const destinatario = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;

  if (!destinatario) {
    console.warn('[Mailer] Advertencia: ADMIN_NOTIFICATION_EMAIL o SMTP_USER no están configurados en el archivo .env. Notificación de reserva omitida.');
    return { exito: false, error: 'ADMIN_NOTIFICATION_EMAIL no configurado en .env' };
  }

  const asunto = 'Nueva reserva recibida - EmiTours.';
  const remitente = process.env.EMAIL_FROM || process.env.SMTP_USER || '"EmiTours Reservas" <no-reply@emitours.com>';

  const html = generarHtmlNotificacionReserva(datos);

  const texto = [
    `Nueva reserva recibida - EmiTours.`,
    `----------------------------------------`,
    `Código de la reserva: ${datos.codigo}`,
    `Nombre del cliente: ${datos.clienteNombre}`,
    `Correo del cliente: ${datos.clienteCorreo || 'No especificado'}`,
    `Teléfono: ${datos.clienteTelefono || 'No especificado'}`,
    `Lugar o tour reservado: ${datos.tourNombre}`,
    `Fecha: ${datos.fecha}`,
    `Hora: ${datos.hora}`,
    `Número de personas: ${datos.numeroPersonas}`,
    `Idioma del tour: ${datos.idioma}`,
    `Precio total: $${Number(datos.precioTotal || 0).toLocaleString('es-CO')} COP`,
    `Método de pago: ${datos.metodoPago}`,
    `Estado de la reserva: ${datos.estadoReserva || 'Pendiente'}`,
    `Estado del pago: ${datos.estadoPago || 'Pendiente'}`
  ].join('\n');

  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: remitente,
      to: destinatario,
      subject: asunto,
      text: texto,
      html
    });

    console.log(`[Mailer] ✅ Notificación de reserva ${datos.codigo} enviada exitosamente a ${destinatario} (ID: ${info.messageId})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Mailer] Vista previa de correo (Ethereal): ${previewUrl}`);
    }

    return { exito: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Mailer] ❌ Error enviando notificación de reserva ${datos.codigo} a ${destinatario}:`, error.message);
    return { exito: false, error: error.message };
  }
}

/**
 * Plantilla HTML para el código de verificación
 */
function generarHtmlCodigoVerificacion(nombre, codigo) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">EmiTours</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Verificación de Correo Electrónico</p>
      </div>
      <div style="padding: 32px 24px; color: #334155;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">¡Hola <strong>${nombre}</strong>!</p>
        <p style="font-size: 14.5px; line-height: 1.6; margin: 0 0 24px 0;">
          Gracias por registrarte en <strong>EmiTours</strong>. Para completar la creación de tu cuenta y activarla, introduce el siguiente código de seguridad de 6 dígitos:
        </p>
        <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 10px; padding: 18px; text-align: center; margin: 0 0 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0369a1;">${codigo}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0;">
          ⏳ <strong>Importante:</strong> Este código es de un solo uso y expirará en <strong>15 minutos</strong>.
        </p>
        <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.4; margin: 0;">
          Si no realizaste esta solicitud, puedes ignorar este mensaje de manera segura.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} EmiTours - Turismo y Experiencias en Medellín.
      </div>
    </div>
  `;
}

/**
 * Plantilla HTML para recuperación de contraseña
 */
function generarHtmlRecuperacion(nombre, codigo) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">EmiTours</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Recuperación de Contraseña</p>
      </div>
      <div style="padding: 32px 24px; color: #334155;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">¡Hola <strong>${nombre || 'Usuario'}</strong>!</p>
        <p style="font-size: 14.5px; line-height: 1.6; margin: 0 0 24px 0;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>EmiTours</strong>. Tu código de seguridad es:
        </p>
        <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 10px; padding: 18px; text-align: center; margin: 0 0 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0369a1;">${codigo}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0;">
          ⏳ <strong>Importante:</strong> Este código es de un solo uso y expirará en <strong>15 minutos</strong>.
        </p>
        <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.4; margin: 0;">
          Si tú no solicitaste este cambio, por favor desestima este correo. Tu contraseña actual sigue siendo segura.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} EmiTours - Seguridad de la Cuenta.
      </div>
    </div>
  `;
}

module.exports = {
  getTransporter,
  verificarConexionSMTP,
  enviarCorreo,
  enviarNotificacionNuevaReserva,
  generarHtmlCodigoVerificacion,
  generarHtmlRecuperacion,
  generarHtmlNotificacionReserva
};
