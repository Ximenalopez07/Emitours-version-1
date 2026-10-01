const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // 1. Si hay credenciales de Gmail o servicio específico configuradas en .env
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    return transporter;
  }

  // 2. Si hay servidor SMTP personalizado en .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // 3. Fallback en desarrollo: Cuenta SMTP Ethereal verificada
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return transporter;
  } catch (err) {
    console.error("No se pudo inicializar transporte de correo:", err.message);
    throw new Error("Servicio de correo no disponible.");
  }
}

/**
 * Enviar correo electrónico con formato HTML profesional y texto plano.
 */
async function enviarCorreo({ destinatario, asunto, texto, html }) {
  try {
    const mailer = await getTransporter();
    const remitente = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"EmiTours" <no-reply@emitours.com>';

    const info = await mailer.sendMail({
      from: remitente,
      to: destinatario,
      subject: asunto,
      text: texto,
      html: html || `<p>${texto}</p>`
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Ethereal Correo Enviado] Vista previa: ${previewUrl}`);
    }

    return { exito: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`Error enviando correo a ${destinatario}:`, error.message);
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
  enviarCorreo,
  generarHtmlCodigoVerificacion,
  generarHtmlRecuperacion
};
