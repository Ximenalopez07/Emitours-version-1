const db = require('../config/db');

// PROCESAR MENSAJE DEL CHATBOT CON CONSULTA EN TIEMPO REAL A MYSQL (INFORMACIÓN REAL)
exports.procesarMensaje = async (req, res) => {
  const usuarioId = req.user?.id || req.user?.id_registro;
  const { mensaje, language } = req.body;
  const isEnglish = (language === 'en');

  if (!usuarioId) {
    return res.status(401).json({
      status: 'ERROR',
      mensaje: isEnglish
        ? 'To use the virtual assistant of EmiTours you must register and log in.'
        : 'Para utilizar el asistente virtual de EmiTours debes registrarte e iniciar sesión.'
    });
  }

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ status: 'ERROR', mensaje: isEnglish ? 'Please send a valid message.' : 'Debes enviar un mensaje válido.' });
  }

  // Normalizar acentos y minúsculas para búsquedas flexibles
  const msg = mensaje.toLowerCase().trim();
  const msgNormalized = mensaje.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  try {
    const query = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, r) => err ? reject(err) : resolve(r));
    });

    let respuesta = "";

    // 1. SOLICITUD DE RESERVA O CÓMO RESERVAR (ORIENTACIÓN ÚNICAMENTE)
    if (msgNormalized.includes('quiero reserv') || msgNormalized.includes('hacer una reserv') || msgNormalized.includes('crear reserv') || msgNormalized.includes('book now') || msgNormalized.includes('how to book') || msgNormalized.includes('como reserv') || msgNormalized.includes('donde reserv')) {
      respuesta = isEnglish
        ? "Sure 😊 You can make your reservation from the **Reservations** section of EmiTours. There you can select the place, date, time, number of people, and payment method."
        : "Claro 😊 Puedes realizar tu reserva desde la sección de **Reservas** de EmiTours. Allí podrás seleccionar el lugar, la fecha, la hora, la cantidad de personas y el método de pago.";
    }

    // 2. DISPONIBILIDAD Y EXPLICACIÓN DE LÍMITE DE 20 RESERVAS VS PERSONAS
    else if (msgNormalized.includes('disponib') || msgNormalized.includes('cuantas reserv') || msgNormalized.includes('quedan') || msgNormalized.includes('cupo') || msgNormalized.includes('availab')) {
      const lugares = await query("SELECT * FROM lugares");

      const tourEncontrado = lugares.find(l => {
        const nomNorm = l.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return msgNormalized.includes(nomNorm) ||
               (nomNorm.includes('guatap') && msgNormalized.includes('guatap')) ||
               (nomNorm.includes('comuna') && msgNormalized.includes('comuna')) ||
               (nomNorm.includes('paisa') && msgNormalized.includes('paisa'));
      });

      if (tourEncontrado) {
        const hoy = new Date().toISOString().split('T')[0];
        const resCount = await query("SELECT COUNT(*) as total FROM reservas WHERE lugar_id = ? AND (fecha >= ? OR fecha IS NULL) AND (estado IS NULL OR estado != 'Cancelada')", [tourEncontrado.id, hoy]);
        const totalRegistradas = resCount[0]?.total || 0;
        const reservasRestantes = Math.max(0, 20 - totalRegistradas);

        if (isEnglish) {
          respuesta = `Currently for **${tourEncontrado.nombre}** there are **${reservasRestantes} reservation spots available**.\n📌 **Rule:** The limit is 20 reservations per place and date. The number of people inside each reservation does not correspond to the limit of 20.`;
        } else {
          respuesta = `Actualmente para el **${tourEncontrado.nombre}** quedan **${reservasRestantes} reservas disponibles**.\n📌 **Regla:** El límite es de 20 reservas por lugar y fecha. La cantidad de personas dentro de cada reserva no corresponde al límite de 20.`;
        }
      } else {
        if (isEnglish) {
          respuesta = "At EmiTours the limit is 20 reservations per tour and date. The number of people inside each reservation does not correspond to the limit of 20. You can check specific availability for any of our tours!";
        } else {
          respuesta = "En EmiTours el límite es de 20 reservas por lugar y fecha. La cantidad de personas dentro de cada reserva no corresponde al límite de 20. ¡Puedes consultarme la disponibilidad de cualquier tour específico!";
        }
      }
    }

    // 3. CONSULTA DE GUÍAS REALES EN MYSQL
    else if (msgNormalized.includes('guia') || msgNormalized.includes('guide')) {
      const guias = await query("SELECT * FROM guias");

      if (!guias || guias.length === 0) {
        respuesta = isEnglish
          ? "There are currently no registered guides in our system at this time."
          : "No tenemos información registrada de guías en nuestro sistema en este momento.";
      } else {
        const listaGuias = guias.map(g => `• **${g.nombre} ${g.apellido || ''}** | ${isEnglish ? 'Language' : 'Idioma'}: ${g.idioma || 'Español'} | Email: ${g.correo || 'N/A'}`).join('\n');
        respuesta = isEnglish
          ? `Our official registered tour guides at EmiTours are:\n\n${listaGuias}`
          : `Nuestros guías turísticos oficiales registrados en EmiTours son:\n\n${listaGuias}`;
      }
    }

    // 4. CONSULTA DE LUGARES / TOURS / PRECIOS REALES
    else if (msgNormalized.includes('lugar') || msgNormalized.includes('tour') || msgNormalized.includes('precio') || msgNormalized.includes('cuesta') || msgNormalized.includes('valor') || msgNormalized.includes('price')) {
      const lugares = await query("SELECT * FROM lugares WHERE estado = 'Activo' OR estado IS NULL");

      const tourEncontrado = lugares.find(l => {
        const nomNorm = l.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return msgNormalized.includes(nomNorm) ||
               (nomNorm.includes('guatap') && msgNormalized.includes('guatap')) ||
               (nomNorm.includes('comuna') && msgNormalized.includes('comuna')) ||
               (nomNorm.includes('paisa') && msgNormalized.includes('paisa'));
      });

      if (tourEncontrado) {
        const precioVal = tourEncontrado.precio ? `$${Number(tourEncontrado.precio).toLocaleString()} COP` : (isEnglish ? 'No price registered for this tour at this time.' : 'No tengo un precio registrado para este tour en este momento.');
        if (isEnglish) {
          respuesta = `📍 **${tourEncontrado.nombre}**\n📝 **Description:** ${tourEncontrado.descripcion || 'Official EmiTours tour'}\n💰 **Price:** ${precioVal}\n⏱️ **Duration:** ${tourEncontrado.duracion || '4 Hours'}`;
        } else {
          respuesta = `📍 **${tourEncontrado.nombre}**\n📝 **Descripción:** ${tourEncontrado.descripcion || 'Tour oficial de EmiTours'}\n💰 **Precio:** ${precioVal}\n⏱️ **Duración:** ${tourEncontrado.duracion || '4 Horas'}`;
        }
      } else {
        const listaTours = lugares.map(l => `• **${l.nombre}** - ${l.precio ? '$' + Number(l.precio).toLocaleString() + ' COP' : (isEnglish ? 'No price registered' : 'Precio no registrado')}`).join('\n');
        respuesta = isEnglish
          ? `Here are the registered places and tours at EmiTours:\n\n${listaTours}`
          : `Aquí tienes los lugares y tours reales registrados en EmiTours:\n\n${listaTours}`;
      }
    }

    // 5. CONSULTA DE HORARIOS PERMITIDOS
    else if (msgNormalized.includes('horario') || msgNormalized.includes('hora') || msgNormalized.includes('time') || msgNormalized.includes('schedule')) {
      respuesta = isEnglish
        ? "You can make reservations from 7:00 AM to 7:00 PM, in 30-minute intervals."
        : "Puedes realizar reservas desde las 7:00 AM hasta las 7:00 PM, en intervalos de 30 minutos.";
    }

    // 6. MÉTODOS Y OPCIONES DE PAGO REALES
    else if (msgNormalized.includes('pago') || msgNormalized.includes('metodo') || msgNormalized.includes('pagar') || msgNormalized.includes('pay') || msgNormalized.includes('nequi') || msgNormalized.includes('pse') || msgNormalized.includes('efectivo') || msgNormalized.includes('datafono')) {
      respuesta = isEnglish
        ? "We accept only 4 payment methods:\n• Nequi\n• PSE\n• Cash payment\n• POS Terminal (Datáfono)\n\n📌 **Payment option:** When making your reservation you can choose to pay now or pay later upon completing the tour with the guide."
        : "Aceptamos únicamente 4 métodos de pago:\n• Nequi\n• PSE\n• Pago en efectivo\n• Datáfono\n\n📌 **Opción de pago:** Al realizar tu reserva puedes elegir entre pagar ahora o pagar al finalizar el tour con la guía.";
    }

    // 7. CONSULTAR LAS PROPIAS RESERVAS DEL USUARIO AUTENTICADO
    else if (msgNormalized.includes('mi reserva') || msgNormalized.includes('mis reserva') || msgNormalized.includes('que reserv') || msgNormalized.includes('tengo reserv') || msgNormalized.includes('my reservation') || msgNormalized.includes('my booking')) {
      const reservasUser = await query(`
        SELECT r.*, l.nombre as lugar_nombre 
        FROM reservas r 
        LEFT JOIN lugares l ON r.lugar_id = l.id 
        WHERE r.usuario_id = ? 
        ORDER BY r.id DESC
      `, [usuarioId]);

      if (reservasUser.length === 0) {
        respuesta = isEnglish
          ? "You currently have no reservations registered with EmiTours. You can make your reservation from the Reservations section!"
          : "Actualmente no tienes reservas registradas en tu cuenta de EmiTours. ¡Puedes realizar tu reserva desde la sección de Reservas!";
      } else {
        const resumenRes = reservasUser.map(r => `• **${r.lugar_nombre || 'Tour EmiTours'}** | Code: \`${r.codigo || 'RES-' + r.id}\` | Date: ${r.fecha ? r.fecha.toString().substring(0, 10) : 'Pending'} | Time: ${r.hora} | People: ${r.numero_personas} | Booking Status: *${r.estado}* | Payment Method: *${r.metodo_pago || 'Nequi'}* | Payment Status: *${r.estado_pago || 'Pendiente'}*`).join('\n');
        respuesta = isEnglish
          ? `Here is your registered reservations history:\n\n${resumenRes}`
          : `Aquí tienes el historial de tus reservas registradas:\n\n${resumenRes}`;
      }
    }

    // 8. SALUDOS E INFORMACIÓN GENERAL
    else if (msgNormalized.includes('hola') || msgNormalized.includes('buenas') || msgNormalized.includes('hello') || msgNormalized.includes('hi') || msgNormalized.includes('emitours') || msgNormalized.includes('quienes somos') || msgNormalized.includes('about')) {
      respuesta = isEnglish
        ? "Hello! 👋 I am the official virtual assistant of EmiTours. I can provide real-time information about our tours, places, prices, guides, available schedules (07:00 AM - 07:00 PM), payment methods, and your own bookings."
        : "¡Hola! 👋 Soy el asistente virtual oficial de EmiTours. Puedo brindarte información en tiempo real sobre nuestros tours, lugares, precios, guías, horarios disponibles (07:00 AM - 07:00 PM), métodos de pago y tus propias reservas.";
    }

    // 9. REGLA ESTRICTA: SI NO EXISTE INFORMACIÓN O ES DESCONOCIDA, NO INVENTAR
    else {
      respuesta = isEnglish
        ? "I do not have registered information about that topic at this time. You can contact EmiTours via WhatsApp for more information."
        : "No tengo información registrada sobre ese tema en este momento. Puedes comunicarte con EmiTours por WhatsApp para obtener más información.";
    }

    // Guardar conversación en la base de datos MySQL
    await query("INSERT INTO chatbot_conversaciones (usuario_id, mensaje_usuario, respuesta_ia) VALUES (?, ?, ?)", [
      usuarioId, mensaje, respuesta
    ]);

    res.json({
      status: 'OK',
      respuesta
    });

  } catch (err) {
    console.error("Error en ChatBot controller:", err);
    res.status(500).json({ status: 'ERROR', mensaje: isEnglish ? 'Error processing assistant query.' : 'Error al procesar la consulta con el asistente virtual.' });
  }
};

// VISTAS Y CONFIGURACIÓN ADMIN
exports.getHistorialAdmin = (req, res) => {
  db.query("SELECT c.*, u.nombre_usuario, u.correo_electronico FROM chatbot_conversaciones c LEFT JOIN registro_usuarios u ON c.usuario_id = u.id_registro ORDER BY c.id DESC LIMIT 100", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getConfigAdmin = (req, res) => {
  db.query("SELECT * FROM chatbot_config WHERE id = 1", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0] || { activo: 1, mensaje_bienvenida: '¡Hola!' });
  });
};

exports.updateConfigAdmin = (req, res) => {
  const { activo, mensaje_bienvenida, faq } = req.body;
  db.query("UPDATE chatbot_config SET activo = ?, mensaje_bienvenida = ?, faq = ? WHERE id = 1", [activo ? 1 : 0, mensaje_bienvenida, faq], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ status: 'OK', mensaje: 'Configuración de ChatBot actualizada' });
  });
};
