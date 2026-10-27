const { Resend } = require('resend');
require('dotenv').config();

let cachedResend = null;

/**
 * Obtener o inicializar el cliente oficial de Resend (HTTPS)
 */
function getResendClient() {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;

  if (!cachedResend) {
    const prefijo = apiKey.substring(0, Math.min(6, apiKey.length));
    const sufijo = apiKey.length > 4 ? apiKey.slice(-4) : '';
    console.log(`[Resend] Inicializando cliente HTTPS oficial (API Key: ${prefijo}...${sufijo})`);
    cachedResend = new Resend(apiKey);
  }
  return cachedResend;
}

/**
 * Determinar el remitente válido para Resend
 * Resend requiere un dominio propio verificado o 'onboarding@resend.dev'.
 * Si se especifica un dominio público (@gmail.com, etc.), se utiliza automáticamente 'onboarding@resend.dev'.
 */
function getRemitenteResend() {
  const envFrom = (process.env.EMAIL_FROM || '').trim();
  if (!envFrom) {
    return 'EmiTours <onboarding@resend.dev>';
  }

  // Si se configuró un proveedor gratuito no verificable en Resend, usar onboarding@resend.dev
  const esDominioPublico = /@(gmail|hotmail|yahoo|outlook)\.com/i.test(envFrom);
  if (esDominioPublico) {
    console.warn(`[Resend] ⚠️ ADVERTENCIA: '${envFrom}' utiliza un dominio público no verificable en Resend. Para garantizar la entrega por HTTPS, se enviará como 'EmiTours <onboarding@resend.dev>'. Configura tu dominio propio en https://resend.com/domains.`);
    return 'EmiTours <onboarding@resend.dev>';
  }

  return envFrom;
}

/**
 * Enviar correo genérico mediante la API HTTPS de Resend
 */
async function enviarCorreo({ destinatario, asunto, texto, html }) {
  if (!destinatario) {
    console.error('[Mailer] ❌ Error: Destinatario no especificado.');
    return { exito: false, error: 'Destinatario no especificado' };
  }

  const resend = getResendClient();
  if (!resend) {
    const msgError = 'RESEND_API_KEY no está configurada en las variables de entorno (.env).';
    console.warn(`[Mailer] ⚠️ Envío omitido hacia ${destinatario}: ${msgError}`);
    return { exito: false, error: msgError };
  }

  try {
    const remitente = getRemitenteResend();
    const payload = {
      from: remitente,
      to: destinatario,
      subject: asunto,
      html: html || `<p>${texto || ''}</p>`
    };
    if (texto) payload.text = texto;

    const respuesta = await resend.emails.send(payload);

    // Manejo estricto de errores devueltos por la API de Resend
    if (respuesta.error) {
      console.error(`[Resend] ❌ Error de la API al enviar correo a ${destinatario}:`, respuesta.error.message || respuesta.error);
      return { exito: false, error: respuesta.error.message || 'Error en Resend API' };
    }

    const messageId = respuesta.data?.id || 'resend-ok';
    console.log(`[Resend] ✅ Correo enviado exitosamente a ${destinatario} (ID: ${messageId})`);
    return { exito: true, messageId };
  } catch (error) {
    console.error(`[Resend] ❌ Excepción al conectar con la API de Resend para ${destinatario}:`, error.message);
    return { exito: false, error: error.message };
  }
}

/**
 * Plantilla HTML profesional para notificación de nueva reserva (Administrador)
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
        <div class="header">
          <h1>EmiTours</h1>
          <p>🔔 ¡Nueva reserva recibida en el sistema!</p>
        </div>

        <div class="content">
          <div class="badge-code">
            <span>Código de la Reserva</span>
            <strong>${codigo}</strong>
          </div>

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
 * Plantilla HTML para confirmación de reserva enviada al cliente
 */
function generarHtmlConfirmacionCliente(datos) {
  const {
    codigo,
    clienteNombre,
    tourNombre,
    fecha,
    hora,
    numeroPersonas,
    idioma,
    precioTotal,
    metodoPago,
    estadoPago
  } = datos;

  const precioFormateado = Number(precioTotal || 0).toLocaleString('es-CO');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .banner { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .banner h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .banner p { margin: 8px 0 0; opacity: 0.95; font-size: 14px; }
        .body-content { padding: 28px 24px; }
        .code-box { background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 16px; text-align: center; margin: 18px 0; }
        .code-box span { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .code-box strong { font-family: monospace; font-size: 24px; color: #0284c7; letter-spacing: 2px; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .info-label { color: #64748b; font-weight: 600; }
        .info-val { color: #0f172a; font-weight: 700; text-align: right; }
        .footer { background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="banner">
          <h1>¡Reserva Confirmada!</h1>
          <p>Tu aventura con EmiTours está lista</p>
        </div>
        <div class="body-content">
          <p style="font-size: 15px; margin: 0 0 12px 0;">¡Hola <strong>${clienteNombre || 'Viajero'}</strong>!</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px 0;">
            Hemos registrado exitosamente tu reserva. A continuación encontrarás el resumen de tu experiencia:
          </p>

          <div class="code-box">
            <span>Tu Código de Reserva</span>
            <strong>${codigo}</strong>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 9px 0; color: #64748b; font-weight: 600; font-size: 14px;">Tour:</td>
              <td style="padding: 9px 0; font-weight: 700; color: #0284c7; font-size: 14px; text-align: right;">${tourNombre}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #64748b; font-weight: 600; font-size: 14px;">Fecha:</td>
              <td style="padding: 9px 0; font-weight: 700; color: #0f172a; font-size: 14px; text-align: right;">${fecha} a las ${hora}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #64748b; font-weight: 600; font-size: 14px;">Personas:</td>
              <td style="padding: 9px 0; font-weight: 700; color: #0f172a; font-size: 14px; text-align: right;">${numeroPersonas}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #64748b; font-weight: 600; font-size: 14px;">Idioma:</td>
              <td style="padding: 9px 0; font-weight: 700; color: #0f172a; font-size: 14px; text-align: right;">${idioma}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #64748b; font-weight: 600; font-size: 14px;">Método de Pago:</td>
              <td style="padding: 9px 0; font-weight: 700; color: #0f172a; font-size: 14px; text-align: right;">${metodoPago}</td>
            </tr>
            <tr>
              <td style="padding: 9px 0; color: #64748b; font-weight: 600; font-size: 14px;">Total:</td>
              <td style="padding: 9px 0; font-weight: 800; color: #0284c7; font-size: 16px; text-align: right;">$${precioFormateado} COP</td>
            </tr>
          </table>

          <div style="margin-top: 22px; padding: 12px 16px; background: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; font-size: 13px; color: #065f46;">
            ✓ Presenta tu código <strong>${codigo}</strong> al momento del encuentro con tu guía.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} EmiTours Medellín. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Enviar notificación de nueva reserva al Administrador y opcionalmente copia al cliente
 */
async function enviarNotificacionNuevaReserva(datos) {
  const destinatarioAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || '').trim();

  if (!destinatarioAdmin) {
    console.warn('[Mailer] ⚠️ Advertencia: ADMIN_NOTIFICATION_EMAIL no está configurado en las variables de entorno. Notificación de reserva omitida.');
    return { exito: false, error: 'ADMIN_NOTIFICATION_EMAIL no configurado' };
  }

  const asunto = `Nueva reserva recibida - EmiTours. [${datos.codigo}]`;
  const htmlAdmin = generarHtmlNotificacionReserva(datos);

  const textoAdmin = [
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

  // 1. Enviar notificación al Administrador
  const resultadoAdmin = await enviarCorreo({
    destinatario: destinatarioAdmin,
    asunto,
    texto: textoAdmin,
    html: htmlAdmin
  });

  if (resultadoAdmin.exito) {
    console.log(`[Mailer] ✅ Notificación de reserva ${datos.codigo} entregada a administrador (${destinatarioAdmin})`);
  } else {
    console.error(`[Mailer] ❌ Falló el envío de notificación de reserva ${datos.codigo} al administrador:`, resultadoAdmin.error);
  }

  // 2. Enviar confirmación al cliente si tiene correo válido (aislado y no bloqueante)
  const correoCliente = (datos.clienteCorreo || '').trim();
  const tieneCorreoValido = correoCliente.includes('@') && correoCliente.toLowerCase() !== 'no especificado' && correoCliente.toLowerCase() !== destinatarioAdmin.toLowerCase();

  if (tieneCorreoValido) {
    try {
      const htmlCliente = generarHtmlConfirmacionCliente(datos);
      const resCliente = await enviarCorreo({
        destinatario: correoCliente,
        asunto: `Confirmación de tu reserva ${datos.codigo} - EmiTours`,
        texto: `¡Hola ${datos.clienteNombre}!\nTu reserva para "${datos.tourNombre}" ha sido registrada con el código ${datos.codigo}.\nFecha: ${datos.fecha} a las ${datos.hora}.\nTotal: $${Number(datos.precioTotal || 0).toLocaleString('es-CO')} COP.\n¡Gracias por elegir EmiTours!`,
        html: htmlCliente
      });

      if (resCliente.exito) {
        console.log(`[Mailer] ✅ Confirmación de reserva ${datos.codigo} enviada al cliente (${correoCliente})`);
      } else {
        console.warn(`[Mailer] ℹ️ No se pudo entregar copia al cliente (${correoCliente}): ${resCliente.error}`);
      }
    } catch (errCli) {
      console.warn(`[Mailer] ℹ️ Error secundario enviando confirmación al cliente:`, errCli.message);
    }
  }

  return resultadoAdmin;
}

/**
 * Plantilla HTML para código de verificación
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

/**
 * Plantilla HTML para notificación de reserva cancelada al Administrador
 */
function generarHtmlNotificacionCancelacion(datos) {
  const {
    codigo,
    clienteNombre,
    clienteCorreo,
    clienteTelefono,
    tourNombre,
    fecha,
    hora,
    numeroPersonas,
    precioTotal,
    montoPagado,
    saldoPendiente,
    fechaCancelacion
  } = datos;

  const totalFmt = Number(precioTotal || 0).toLocaleString('es-CO');
  const pagadoFmt = Number(montoPagado || 0).toLocaleString('es-CO');
  const saldoFmt = Number(saldoPendiente || 0).toLocaleString('es-CO');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 30px 28px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.95; }
        .content { padding: 30px 28px; }
        .badge-code { background: #fef2f2; border: 2px dashed #ef4444; border-radius: 10px; padding: 14px 20px; text-align: center; margin-bottom: 24px; }
        .badge-code span { display: block; font-size: 12px; color: #991b1b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .badge-code strong { font-family: monospace; font-size: 26px; color: #dc2626; letter-spacing: 2px; }
        .notice-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 22px; font-size: 13px; color: #92400e; line-height: 1.5; }
        .section-title { font-size: 14px; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.8px; margin: 20px 0 10px; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; }
        .table-details { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .table-details td { padding: 9px 8px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; }
        .table-details td.label { font-weight: 600; color: #64748b; width: 42%; }
        .table-details td.value { font-weight: 700; color: #0f172a; }
        .pill-cancelled { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700; background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; text-transform: uppercase; }
        .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EmiTours</h1>
          <p>⚠️ Notificación: Una reserva ha sido cancelada por el usuario</p>
        </div>

        <div class="content">
          <div class="badge-code">
            <span>Código de Reserva Cancelada</span>
            <strong>${codigo}</strong>
          </div>

          <div class="notice-box">
            ℹ️ <strong>Información importante:</strong> La cancelación de esta reserva no implica una devolución automática ni reembolso del dinero pagado. Los importes registrados permanecen sin alteraciones financieras en el sistema.
          </div>

          <div class="section-title">👤 Datos del Usuario</div>
          <table class="table-details">
            <tr>
              <td class="label">Nombre del usuario:</td>
              <td class="value">${clienteNombre || 'No especificado'}</td>
            </tr>
            <tr>
              <td class="label">Correo electrónico:</td>
              <td class="value">${clienteCorreo || 'No especificado'}</td>
            </tr>
            <tr>
              <td class="label">Teléfono:</td>
              <td class="value">${clienteTelefono || 'No especificado'}</td>
            </tr>
          </table>

          <div class="section-title">🏔️ Información del Tour</div>
          <table class="table-details">
            <tr>
              <td class="label">Tour / Destino:</td>
              <td class="value" style="color: #0284c7;">${tourNombre}</td>
            </tr>
            <tr>
              <td class="label">Fecha y hora programada:</td>
              <td class="value">${fecha} a las ${hora}</td>
            </tr>
            <tr>
              <td class="label">Personas:</td>
              <td class="value">${numeroPersonas}</td>
            </tr>
            <tr>
              <td class="label">Fecha de cancelación:</td>
              <td class="value">${fechaCancelacion}</td>
            </tr>
            <tr>
              <td class="label">Estado final:</td>
              <td class="value"><span class="pill-cancelled">Reserva eliminada</span></td>
            </tr>
          </table>

          <div class="section-title">💳 Estado Financiero</div>
          <table class="table-details">
            <tr>
              <td class="label">Precio total del tour:</td>
              <td class="value">$${totalFmt} COP</td>
            </tr>
            <tr>
              <td class="label">Importe pagado:</td>
              <td class="value" style="color: #059669;">$${pagadoFmt} COP</td>
            </tr>
            <tr>
              <td class="label">Saldo pendiente:</td>
              <td class="value" style="color: #b45309;">$${saldoFmt} COP</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px;">Notificación oficial automática de <strong>EmiTours</strong>.</p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">El estado de esta reserva se encuentra visible en el dashboard administrativo como "Reserva eliminada".</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Enviar notificación por correo al Administrador cuando un usuario cancela una reserva
 */
async function enviarNotificacionCancelacionReserva(datos) {
  const destinatarioAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || '').trim();

  if (!destinatarioAdmin) {
    console.warn('[Mailer] ⚠️ Advertencia: ADMIN_NOTIFICATION_EMAIL no está configurado en las variables de entorno. Notificación de cancelación omitida.');
    return { exito: false, error: 'ADMIN_NOTIFICATION_EMAIL no configurado' };
  }

  const fechaCancelacion = datos.fechaCancelacion || new Date().toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
  const asunto = 'EmiTours - Reserva cancelada por un usuario';

  const datosCompletos = {
    ...datos,
    fechaCancelacion
  };

  const html = generarHtmlNotificacionCancelacion(datosCompletos);

  const texto = [
    `EmiTours - Reserva cancelada por un usuario`,
    `----------------------------------------`,
    `Código de la reserva: ${datos.codigo}`,
    `Nombre del usuario: ${datos.clienteNombre}`,
    `Correo electrónico: ${datos.clienteCorreo || 'No especificado'}`,
    `Teléfono: ${datos.clienteTelefono || 'No especificado'}`,
    `Tour reservado: ${datos.tourNombre}`,
    `Fecha y hora: ${datos.fecha} a las ${datos.hora}`,
    `Número de personas: ${datos.numeroPersonas}`,
    `Precio total: $${Number(datos.precioTotal || 0).toLocaleString('es-CO')} COP`,
    `Importe pagado: $${Number(datos.montoPagado || 0).toLocaleString('es-CO')} COP`,
    `Saldo pendiente: $${Number(datos.saldoPendiente || 0).toLocaleString('es-CO')} COP`,
    `Fecha de cancelación: ${fechaCancelacion}`,
    `Estado final: Reserva eliminada`,
    ``,
    `Ten en cuenta que esta cancelación no implica una devolución automática ni reembolso del dinero pagado.`
  ].join('\n');

  try {
    const resultado = await enviarCorreo({
      destinatario: destinatarioAdmin,
      asunto,
      texto,
      html
    });

    if (resultado.exito) {
      console.log(`[Mailer] ✅ Notificación de cancelación de reserva ${datos.codigo} enviada al administrador (${destinatarioAdmin})`);
    } else {
      console.error(`[Mailer] ❌ Error de Resend al notificar cancelación de reserva ${datos.codigo}:`, resultado.error);
    }

    return resultado;
  } catch (error) {
    console.error(`[Mailer] ❌ Excepción al notificar cancelación de reserva ${datos.codigo}:`, error.message);
    return { exito: false, error: error.message };
  }
}

module.exports = {
  getResendClient,
  enviarCorreo,
  enviarNotificacionNuevaReserva,
  enviarNotificacionCancelacionReserva,
  generarHtmlCodigoVerificacion,
  generarHtmlRecuperacion,
  generarHtmlNotificacionReserva,
  generarHtmlConfirmacionCliente,
  generarHtmlNotificacionCancelacion
};

