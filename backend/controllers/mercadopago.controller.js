const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const db = require('../config/db');

// Inicializar cliente Mercado Pago con Access Token del entorno
const getMercadoPagoClient = () => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    console.warn('[MercadoPago] ⚠️ MERCADO_PAGO_ACCESS_TOKEN no está definido en .env');
  }
  return new MercadoPagoConfig({
    accessToken: token || '',
    options: { timeout: 10000 }
  });
};

// ========================================================
// 1. CREAR PREFERENCIA DE PAGO (CHECKOUT PRO)
// ========================================================
exports.crearPreferencia = async (req, res) => {
  try {
    const {
      usuario_id,
      lugar_id,
      numero_personas,
      fecha,
      hora,
      idioma,
      tipo_pago,
      metodo_pago
    } = req.body;

    const uId = usuario_id || req.body.id_usuario || req.user?.id || req.user?.id_registro;
    const lId = lugar_id || req.body.id_lugar || req.body.tour_id;

    if (!uId || !lId || !fecha) {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'Faltan datos obligatorios para iniciar el pago (usuario, tour o fecha).'
      });
    }

    const cantidadPersonas = parseInt(numero_personas, 10) || 1;
    if (cantidadPersonas < 1) {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'La cantidad de personas debe ser al menos 1.'
      });
    }

    const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : String(fecha).substring(0, 10);

    // 1. Validar límite de 20 reservas en la fecha seleccionada
    const [resCount] = await db.promise().query(
      "SELECT COUNT(*) as total FROM reservas WHERE lugar_id = ? AND fecha = ? AND (estado != 'cancelada')",
      [lId, fechaStr]
    );
    const totalReservas = resCount[0]?.total || 0;
    if (totalReservas >= 20) {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'Lo sentimos, este lugar ya alcanzó el límite de 20 reservas para esta fecha.'
      });
    }

    // 2. Obtener datos del tour desde MySQL para garantizar cálculo veraz del precio
    const [resLugar] = await db.promise().query("SELECT * FROM lugares WHERE id = ?", [lId]);
    if (!resLugar || resLugar.length === 0) {
      return res.status(404).json({ status: 'ERROR', mensaje: 'Tour o lugar no encontrado.' });
    }
    const lugar = resLugar[0];

    // Precios por defecto acordes al catálogo del sistema si no están en la tabla
    const preciosCatalogados = {
      "Guatapé": 250000,
      "Comuna 13": 100000,
      "Metro Cable": 80000,
      "Pablo Escobar": 150000,
      "Pueblito Paisa": 75000,
      "City Tour": 90000
    };

    let precioUnitario = Number(lugar.precio || 0);
    if (!precioUnitario || precioUnitario <= 0) {
      for (const [key, val] of Object.entries(preciosCatalogados)) {
        if (lugar.nombre && lugar.nombre.toLowerCase().includes(key.toLowerCase())) {
          precioUnitario = val;
          break;
        }
      }
      if (!precioUnitario) precioUnitario = 100000;
    }

    const precioTotal = Math.round(precioUnitario * cantidadPersonas);
    const esPagoTotal = (tipo_pago === 'total' || String(tipo_pago).includes('100'));
    const montoACobrar = esPagoTotal ? precioTotal : Math.round(precioTotal * 0.5);
    const saldoPendiente = esPagoTotal ? 0 : (precioTotal - montoACobrar);

    // 3. Consultar datos del comprador para precargarlos en Mercado Pago
    const [resUser] = await db.promise().query(
      "SELECT nombre_usuario, correo_electronico, telefono FROM registro_usuarios WHERE id_registro = ?",
      [uId]
    );
    const cliente = resUser && resUser.length > 0 ? resUser[0] : null;

    // Identificar correos del administrador / vendedor para evitar conflicto de auto-pago (error /fatal/)
    const emailAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || '').toLowerCase().trim();
    const emailCliente = (cliente?.correo_electronico || req.body.email || '').toLowerCase().trim();
    const esMismoVendedor = emailAdmin && emailCliente && (emailAdmin === emailCliente);

    // Configuración del objeto 'payer':
    // En Mercado Pago Checkout Pro, el objeto 'payer' es 100% opcional en la preferencia.
    // En Sandbox, si se envía un email no registrado en Mercado Pago o el correo del vendedor,
    // la pasarela Sandbox rechaza la transacción con error /fatal/ ("Oh, no, algo anduvo mal").
    // Por ello, solo incluimos 'payer' si se proporciona un comprador de prueba explícito
    // (mediante MERCADO_PAGO_TEST_BUYER_EMAIL en .env o email_comprador en el body) y que no coincida con el vendedor.
    let payerObj = undefined;
    const testBuyerEnv = process.env.MERCADO_PAGO_TEST_BUYER_EMAIL ? process.env.MERCADO_PAGO_TEST_BUYER_EMAIL.trim() : null;
    const customBuyer = req.body.email_comprador ? String(req.body.email_comprador).trim() : null;
    const finalBuyerEmail = customBuyer || testBuyerEnv;

    if (finalBuyerEmail && finalBuyerEmail.includes('@') && !esMismoVendedor) {
      payerObj = {
        name: (cliente?.nombre_usuario || req.body.nombre_completo || 'Comprador de Prueba').trim(),
        email: finalBuyerEmail
      };
    }

    // 4. Configurar URLs de retorno y crear la preferencia en Mercado Pago
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    // Obtener la URL base del frontend desde .env, headers o valor por defecto
    const frontendBaseUrl = (process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173').replace(/\/+$/, '');
    const returnUrl = `${frontendBaseUrl}/reservas`;

    // Mercado Pago exige que para usar auto_return: 'approved', la URL sea HTTPS pública (no localhost)
    const isPublicHttps = returnUrl.startsWith('https://') && !returnUrl.includes('localhost') && !returnUrl.includes('127.0.0.1');

    // Webhook URL si está configurada en .env o si hay URL pública disponible
    const webhookUrl = process.env.WEBHOOK_URL || (isPublicHttps ? `${process.env.BACKEND_URL || ''}/mercadopago/webhook` : null);

    const preferenceBody = {
      items: [
        {
          id: `TOUR-${lugar.id}`,
          title: `EmiTours: ${lugar.nombre} (${esPagoTotal ? 'Pago 100%' : 'Abono 50%'})`,
          description: `Tour ${lugar.nombre} para ${cantidadPersonas} persona(s) el ${fechaStr} a las ${hora || '07:00 AM'}.`,
          quantity: 1,
          unit_price: montoACobrar,
          currency_id: 'COP'
        }
      ],
      ...(payerObj ? { payer: payerObj } : {}),
      // back_urls debe incluirse SIEMPRE para que el botón "Volver al comercio" redirija al frontend
      back_urls: {
        success: returnUrl,
        failure: returnUrl,
        pending: returnUrl
      },
      ...(isPublicHttps ? { auto_return: 'approved' } : {}),
      ...(webhookUrl ? { notification_url: webhookUrl } : {}),
      metadata: {
        usuario_id: uId,
        nombre_completo: (cliente?.nombre_usuario || req.body.nombre_completo || 'Cliente EmiTours').trim(),
        celular: (cliente?.telefono || req.body.celular || '').trim(),
        tour_nombre: lugar.nombre,
        precio_unitario: (lugar.precio || 150000),
        lugar_id: lId,
        numero_personas: cantidadPersonas,
        fecha: fechaStr,
        hora: hora || '07:00 AM',
        idioma: idioma || 'es',
        tipo_pago: esPagoTotal ? 'total' : '50',
        metodo_pago: metodo_pago || 'mercadopago',
        precio_total: precioTotal,
        monto_cobrado: montoACobrar,
        saldo_pendiente: saldoPendiente
      },
      external_reference: `EMT-${Date.now()}-${uId}`
    };

    const mpRes = await preference.create({ body: preferenceBody });
    const checkoutUrl = mpRes.sandbox_init_point || mpRes.init_point;

    console.log(`[MercadoPago] === Preferencia Creada Exitosamente ===`);
    console.log(`  - Preference ID: ${mpRes.id}`);
    console.log(`  - Collector ID: ${mpRes.collector_id}`);
    console.log(`  - Sandbox Init Point: ${mpRes.sandbox_init_point}`);
    console.log(`  - Init Point: ${mpRes.init_point}`);
    console.log(`  - Payer incluido en preferencia: ${payerObj ? payerObj.email : 'Omitido (Permite iniciar sesión con Test Buyer libremente)'}`);
    console.log(`  - Back URLs: ${returnUrl}`);
    console.log(`====================================================`);

    return res.json({
      status: 'OK',
      preferenceId: mpRes.id,
      initPoint: mpRes.init_point,
      sandboxInitPoint: mpRes.sandbox_init_point || mpRes.init_point,
      checkoutUrl,
      montoACobrar,
      precioTotal,
      saldoPendiente,
      esPagoTotal
    });
  } catch (error) {
    console.error('[MercadoPago] Error al crear preferencia:', error);
    return res.status(500).json({
      status: 'ERROR',
      mensaje: 'Error al generar checkout de Mercado Pago: ' + (error.message || 'Error desconocido')
    });
  }
};

// ========================================================
// 2. VERIFICAR PAGO CON LA API DE MERCADO PAGO
// ========================================================
exports.verificarPago = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId || paymentId === 'null' || paymentId === 'undefined') {
      return res.status(400).json({
        status: 'ERROR',
        mensaje: 'Se requiere un paymentId válido para la verificación.'
      });
    }

    // 1. Consultar si este payment_id ya fue utilizado para confirmar otra reserva
    const [resExistente] = await db.promise().query(
      "SELECT id, codigo, fecha, precio_total, estado FROM reservas WHERE mp_payment_id = ?",
      [paymentId]
    );

    if (resExistente && resExistente.length > 0) {
      return res.json({
        status: 'OK',
        aprobado: true,
        ya_utilizado: true,
        reserva: resExistente[0],
        mensaje: 'Este pago ya fue utilizado para confirmar una reserva previamente.'
      });
    }

    // 2. Consultar directamente a la API de Mercado Pago con el SDK
    const client = getMercadoPagoClient();
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (!paymentData) {
      return res.status(404).json({
        status: 'ERROR',
        mensaje: 'No se encontró la transacción en Mercado Pago.'
      });
    }

    const estadoMP = paymentData.status; // 'approved', 'in_process', 'pending', 'rejected', 'cancelled'
    const esAprobado = (estadoMP === 'approved');
    const esPendiente = (estadoMP === 'pending' || estadoMP === 'in_process' || estadoMP === 'authorized');
    const esRechazado = (estadoMP === 'rejected' || estadoMP === 'cancelled' || estadoMP === 'refunded' || estadoMP === 'charged_back');

    return res.json({
      status: 'OK',
      paymentId: String(paymentData.id),
      estado_mp: estadoMP,
      aprobado: esAprobado,
      pendiente: esPendiente,
      rechazado: esRechazado,
      monto: Number(paymentData.transaction_amount || 0),
      moneda: paymentData.currency_id,
      metodo_pago: paymentData.payment_method_id,
      tipo_metodo: paymentData.payment_type_id,
      status_detail: paymentData.status_detail,
      metadata: paymentData.metadata || {},
      ya_utilizado: false
    });
  } catch (error) {
    console.error(`[MercadoPago] Error al verificar pago ${req.params.paymentId}:`, error);
    return res.status(500).json({
      status: 'ERROR',
      mensaje: 'Error al consultar transacción en Mercado Pago: ' + (error.message || 'Error desconocido')
    });
  }
};

// ========================================================
// 2.1. OBTENER ÚLTIMO PAGO EN SANDBOX (AUTO-RECUPERACIÓN EN LOCALHOST)
// ========================================================
exports.obtenerUltimoPago = async (req, res) => {
  try {
    const client = getMercadoPagoClient();
    const payment = new Payment(client);
    const searchRes = await payment.search({
      options: {
        sort: 'date_created',
        criteria: 'desc',
        limit: 1
      }
    });

    if (!searchRes || !searchRes.results || searchRes.results.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        mensaje: 'No se encontraron pagos recientes en Mercado Pago Sandbox.'
      });
    }

    const ultimo = searchRes.results[0];
    req.params.paymentId = String(ultimo.id);
    return exports.verificarPago(req, res);
  } catch (error) {
    console.error('[MercadoPago] Error al consultar último pago:', error);
    return res.status(500).json({
      status: 'ERROR',
      mensaje: 'Error al buscar pagos recientes: ' + (error.message || 'Error desconocido')
    });
  }
};

// ========================================================
// 3. OBTENER PUBLIC KEY PARA EL FRONTEND
// ========================================================
exports.getConfigPublica = (req, res) => {
  return res.json({
    status: 'OK',
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || ''
  });
};

// ========================================================
// 4. WEBHOOK / NOTIFICACIONES IPN DE MERCADO PAGO
// ========================================================
exports.procesarWebhook = async (req, res) => {
  try {
    const topic = req.query.topic || req.query.type || req.body?.type;
    const paymentId = req.query.id || req.query['data.id'] || req.body?.data?.id;

    // Responder inmediatamente con 200 OK a Mercado Pago para confirmar recepción
    res.status(200).send('OK');

    if ((topic === 'payment' || topic === 'collection') && paymentId) {
      const client = getMercadoPagoClient();
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: String(paymentId) });

      if (paymentData) {
        const estado = paymentData.status; // 'approved', 'pending', 'in_process', 'rejected'
        const monto = parseFloat(paymentData.transaction_amount || 0);

        const meta = paymentData.metadata || {};
        const esPagoTotal = (meta.tipo_pago === 'total');

        if (estado === 'approved') {
          estadoReserva = 'confirmada';
          estadoPago = esPagoTotal ? 'pagado' : 'parcial';
        } else if (estado === 'rejected' || estado === 'cancelled') {
          estadoReserva = 'cancelada';
          estadoPago = 'pendiente';
        }

        // 1. Actualizar reserva por mp_payment_id si ya existe registrada
        const [resUpdate] = await db.promise().query(
          `UPDATE reservas 
           SET estado = ?, 
               estado_pago = ?, 
               monto_pagado = CASE WHEN ? = 'approved' THEN ? ELSE monto_pagado END
           WHERE mp_payment_id = ?`,
          [estadoReserva, estadoPago, estado, monto, String(paymentId)]
        );

        console.log(`[MercadoPago Webhook] Pago ${paymentId} (${estado}): ${resUpdate.affectedRows} reserva(s) sincronizada(s).`);

        // 2. Si la reserva aún no existía y el pago fue aprobado, crearla automáticamente como respaldo
        if (resUpdate.affectedRows === 0 && estado === 'approved' && meta.usuario_id && meta.lugar_id) {
          const [checkDup] = await db.promise().query("SELECT id FROM reservas WHERE mp_payment_id = ?", [String(paymentId)]);
          if (!checkDup || checkDup.length === 0) {
            const uId = meta.usuario_id;
            const lId = meta.lugar_id;
            const cant = meta.numero_personas || 1;
            const fechaStr = meta.fecha;
            const horaSql = meta.hora || '07:00 AM';
            const idiomaClean = meta.idioma || 'es';
            const precioTot = parseFloat(meta.precio_total || monto);
            const codigo = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

            await db.promise().query(
              `INSERT INTO reservas (
                usuario_id, lugar_id, fecha, hora, numero_personas, idioma,
                precio_total, metodo_pago, estado_pago, estado, codigo,
                mp_payment_id, monto_pagado
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmada', ?, ?, ?)`,
              [uId, lId, fechaStr, horaSql, cant, idiomaClean, precioTot, 'mercadopago', estadoPago, codigo, String(paymentId), monto]
            );
            console.log(`[MercadoPago Webhook] 🚀 Reserva ${codigo} creada automáticamente desde Webhook para pago #${paymentId}.`);
          }
        }
      }
    }
  } catch (error) {
    console.error('[MercadoPago Webhook] Error al procesar notificación:', error.message);
  }
};

