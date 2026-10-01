const db = require('../config/db');

// Precios y configuración sincronizada con el módulo de Reservas
const PRECIOS_TOURS = {
  "Guatapé": 250000,
  "Comuna 13": 100000,
  "Pablo Escobar": 150000,
  "Pueblito Paisa": 75000,
  "City Tour": 90000,
  "Metro Cable": 80000
};

function getPrecioTour(nombre) {
  if (!nombre) return 100000;
  const nomNorm = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  for (const [k, v] of Object.entries(PRECIOS_TOURS)) {
    const kNorm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (nomNorm.includes(kNorm) || kNorm.includes(nomNorm)) return v;
  }
  return 100000;
}

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

    // 1. ANÁLISIS DE PRESUPUESTO ("Tengo 100000 pesos", "¿Qué tour puedo hacer con $100.000 COP?", etc.)
    let extractedBudget = null;
    const budgetMatch = msgNormalized.match(/(?:tengo|presupuesto|con|dispongo\s+de|cuento\s+con)\s*(?:\$)?\s*([0-9]+(?:[.,][0-9]{3})*)\s*(?:mil|k|pesos|cop)?/i)
      || msgNormalized.match(/([0-9]+(?:[.,][0-9]{3})*)\s*(?:mil|k|pesos|cop)/i);

    if (budgetMatch) {
      let numStr = budgetMatch[1].replace(/[.,]/g, '');
      let val = parseInt(numStr, 10);
      if (budgetMatch[0].toLowerCase().includes('mil') && val < 1000) val *= 1000;
      if (budgetMatch[0].toLowerCase().includes('k') && val < 1000) val *= 1000;
      if (!isNaN(val) && val > 0) extractedBudget = val;
    }

    if (extractedBudget !== null && (msgNormalized.includes('recomiend') || msgNormalized.includes('tour') || msgNormalized.includes('puedo') || msgNormalized.includes('hacer') || msgNormalized.includes('alcanza') || msgNormalized.includes('presupuesto') || msgNormalized.includes('tengo'))) {
      const lugares = await query("SELECT id, nombre, descripcion, imagen FROM lugares");
      // Precios sincronizados con el módulo de Reservas
      const toursConPrecio = lugares.map(l => ({
        ...l,
        precio: getPrecioTour(l.nombre),
        idiomas: "Español e Inglés"
      }));

      const toursAccesibles = toursConPrecio.filter(t => t.precio <= extractedBudget);

      if (toursAccesibles.length === 0) {
        respuesta = isEnglish
          ? `Currently, available tours start from $75,000 COP, which is above your budget of $${extractedBudget.toLocaleString()} COP. You can check our available destinations and choose the one you prefer.`
          : `Actualmente los tours disponibles inician desde $75.000 COP, valor superior a tu presupuesto de $${extractedBudget.toLocaleString()} COP. Puedes consultar los destinos disponibles en Reservas y elegir el que prefieras.`;
      } else {
        const detalleTours = toursAccesibles.map(t => 
          `📍 **${t.nombre}**\n💰 **${isEnglish ? 'Price' : 'Precio real'}:** $${t.precio.toLocaleString()} COP\n📝 **${isEnglish ? 'Includes' : 'Qué incluye'}:** ${t.descripcion}\n🌐 **${isEnglish ? 'Languages' : 'Idiomas disponibles'}:** ${t.idiomas}`
        ).join('\n\n');

        respuesta = isEnglish
          ? `With your budget of $${extractedBudget.toLocaleString()} COP, here are the available tours you can enjoy:\n\n${detalleTours}`
          : `Con tu presupuesto de $${extractedBudget.toLocaleString()} COP, estos son los tours disponibles que puedes realizar:\n\n${detalleTours}`;
      }
    }

    // 2. PREGUNTAS SOBRE PAGOS DEL 50% ("¿Cuánto debo pagar para reservar?", "¿Puedo pagar la mitad?", etc.)
    else if (msgNormalized.includes('cuanto debo pagar') || msgNormalized.includes('cuanto tengo que pagar') || msgNormalized.includes('cuanto pago') || msgNormalized.includes('pagar la mitad') || msgNormalized.includes('puedo pagar la mitad') || msgNormalized.includes('pago la mitad') || msgNormalized.includes('pago inicial') || msgNormalized.includes('50%')) {
      respuesta = isEnglish
        ? "To book any tour at EmiTours, you must pay **50% of the total price** as an obligatory initial payment. **Yes, you can and must pay half upon booking!** The remaining 50% remains as a pending balance to be settled before starting the tour."
        : "Para reservar cualquier tour en EmiTours debes abonar el **50% del precio total** como pago inicial obligatorio. **¡Sí, puedes y debes pagar la mitad al reservar!** El 50% restante queda como saldo pendiente a cancelar antes de iniciar el tour.";
    }

    // 3. MÉTODOS DE PAGO
    else if (msgNormalized.includes('metodo') || msgNormalized.includes('como pagar') || msgNormalized.includes('metodos de pago') || msgNormalized.includes('formas de pago') || msgNormalized.includes('nequi') || msgNormalized.includes('pse') || msgNormalized.includes('datafono') || msgNormalized.includes('efectivo')) {
      respuesta = isEnglish
        ? "At EmiTours we accept 4 payment methods:\n• **Nequi**\n• **PSE**\n• **Cash payment (Pago en efectivo)**\n• **POS Terminal (Datáfono)**\n\n📌 Remember that the initial payment is 50% upon making your reservation."
        : "En EmiTours aceptamos 4 métodos de pago oficiales:\n• **Nequi**\n• **PSE**\n• **Pago en efectivo**\n• **Datáfono**\n\n📌 Recuerda que se abona el 50% inicial obligatorio al realizar la reserva.";
    }

    // 4. PREGUNTA ESPECÍFICA: "¿CUÁNTO CUESTA EL TOUR DE COMUNA 13?" U OTRO LUGAR
    else if (msgNormalized.includes('comuna 13') || msgNormalized.includes('guatape') || msgNormalized.includes('pablo escobar') || msgNormalized.includes('pueblito paisa') || msgNormalized.includes('metro cable') || msgNormalized.includes('city tour')) {
      const lugares = await query("SELECT id, nombre, descripcion, imagen FROM lugares");
      const tourEncontrado = lugares.find(l => {
        const nomNorm = l.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return msgNormalized.includes(nomNorm) ||
               (nomNorm.includes('guatap') && msgNormalized.includes('guatap')) ||
               (nomNorm.includes('comuna') && msgNormalized.includes('comuna')) ||
               (nomNorm.includes('paisa') && msgNormalized.includes('paisa')) ||
               (nomNorm.includes('cable') && msgNormalized.includes('cable')) ||
               (nomNorm.includes('city') && msgNormalized.includes('city'));
      });

      if (tourEncontrado) {
        const precio = getPrecioTour(tourEncontrado.nombre);
        const pagoInicial = Math.round(precio * 0.5);
        respuesta = isEnglish
          ? `📍 **${tourEncontrado.nombre}**\n💰 **Real Price:** $${precio.toLocaleString()} COP per person\n💳 **Initial Payment (50%):** $${pagoInicial.toLocaleString()} COP\n📝 **Includes:** Tour guide, health insurance, and full route\n🌐 **Available Guides:** Spanish and English`
          : `📍 **${tourEncontrado.nombre}**\n💰 **Precio real:** $${precio.toLocaleString()} COP por persona\n💳 **Pago inicial obligatorio (50%):** $${pagoInicial.toLocaleString()} COP\n📝 **Qué incluye:** Guía experto, seguro de asistencia y recorrido completo\n🌐 **Idiomas disponibles:** Guía en Español y en Inglés`;
      } else {
        respuesta = isEnglish
          ? "The requested tour has bilingual guide options and requires a 50% initial payment."
          : "El tour solicitado cuenta con opciones de guía bilingüe y requiere el 50% de pago inicial al reservar.";
      }
    }

    // 5. IDIOMAS DE GUÍAS ("¿Qué tours tienen guía en inglés / español?")
    else if (msgNormalized.includes('ingles') || msgNormalized.includes('english') || msgNormalized.includes('espanol') || msgNormalized.includes('spanish') || msgNormalized.includes('idioma')) {
      const guias = await query("SELECT nombre, apellido, idioma FROM guias");
      const tieneIngles = guias.some(g => (g.idioma || '').toLowerCase().includes('ingl') || (g.idioma || '').toLowerCase().includes('en'));
      const tieneEspanol = guias.some(g => (g.idioma || '').toLowerCase().includes('espa') || (g.idioma || '').toLowerCase().includes('es'));

      respuesta = isEnglish
        ? "All EmiTours tours feature certified guides available in **Spanish** and **English**. When booking, you can choose your preferred language."
        : "Todos los tours de EmiTours cuentan con guías certificados disponibles tanto en **Español** como en **Inglés**. Al momento de realizar tu reserva en la página, puedes seleccionar el idioma solicitado para el tour.";
    }

    // 6. CAPACIDAD Y PERSONAS ("¿Cuántas personas puedo llevar?")
    else if (msgNormalized.includes('cuantas personas') || msgNormalized.includes('cuantas persona') || msgNormalized.includes('personas puedo') || msgNormalized.includes('limite de personas') || msgNormalized.includes('cuanta gente') || msgNormalized.includes('how many people')) {
      respuesta = isEnglish
        ? "There is **no limit on the number of people** per reservation; you can bring as many companions as you wish. However, keep in mind that each place has a limit of 20 reservations per date."
        : "En EmiTours **no hay límite de personas por reserva**; puedes registrar la cantidad de acompañantes que desees. Ten en cuenta que cada lugar turístico maneja un límite de 20 reservas por fecha.";
    }

    // 7. HORARIOS DISPONIBLES ("¿A qué hora puedo reservar?")
    else if (msgNormalized.includes('a que hora') || msgNormalized.includes('que hora') || msgNormalized.includes('horario') || msgNormalized.includes('horas') || msgNormalized.includes('schedule') || msgNormalized.includes('time')) {
      respuesta = isEnglish
        ? "Available hours for booking and taking tours are from **7:00 AM to 7:00 PM**, in 30-minute intervals."
        : "Los horarios disponibles para reservar y realizar tours son de **7:00 AM a 7:00 PM**, en intervalos de 30 minutos.";
    }

    // 8. CÓMO RESERVAR ("¿Cómo puedo reservar?")
    else if (msgNormalized.includes('como puedo reservar') || msgNormalized.includes('como reservo') || msgNormalized.includes('como reservar') || msgNormalized.includes('donde reservar') || msgNormalized.includes('quiero reservar') || msgNormalized.includes('how to book')) {
      respuesta = isEnglish
        ? "To book a tour at EmiTours:\n1. Go to the **Reservations** section in the top menu.\n2. Choose the tour you want to visit.\n3. Select your date, time, number of people, and tour language (Spanish or English).\n4. Choose your payment method (Nequi, PSE, Cash, or Datáfono).\n5. Pay the **mandatory 50% initial payment** to confirm your booking spot."
        : "Para realizar una reserva en EmiTours:\n1. Ingresa a la sección de **Reservas** en el menú superior.\n2. Selecciona el tour que deseas visitar.\n3. Elige la fecha, hora, cantidad de personas e idioma (Español o Inglés).\n4. Selecciona tu método de pago (Nequi, PSE, Efectivo o Datáfono).\n5. Realiza el **pago inicial obligatorio del 50%** para asegurar tu cupo.";
    }

    // 9. QUÉ TOURS TIENEN / QUÉ LUGAR PUEDO VISITAR / CUÁNTO CUESTA EL TOUR
    else if (msgNormalized.includes('que tour') || msgNormalized.includes('que lugar') || msgNormalized.includes('que lugares') || msgNormalized.includes('cuesta el tour') || msgNormalized.includes('cuanto cuesta') || msgNormalized.includes('precios') || msgNormalized.includes('tours tienen')) {
      const lugares = await query("SELECT id, nombre, descripcion, imagen FROM lugares");
      const listaTours = lugares.map(l => {
        const precio = getPrecioTour(l.nombre);
        const pagoInicial = Math.round(precio * 0.5);
        return `• **${l.nombre}** - $${precio.toLocaleString()} COP por persona (Pago inicial 50%: $${pagoInicial.toLocaleString()} COP)`;
      }).join('\n');

      respuesta = isEnglish
        ? `Here are the official tours and real prices available at EmiTours:\n\n${listaTours}\n\n📌 Each tour includes a professional guide in Spanish or English and requires an initial payment of 50%.`
        : `Aquí tienes los tours y precios reales disponibles en EmiTours:\n\n${listaTours}\n\n📌 Todos los tours cuentan con guía profesional en español o inglés y requieren el 50% de pago inicial al reservar.`;
    }

    // 10. CONSULTA DE GUÍAS REALES EN MYSQL
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

    // 11. DISPONIBILIDAD Y LÍMITE DE 20 RESERVAS
    else if (msgNormalized.includes('disponib') || msgNormalized.includes('cuantas reserv') || msgNormalized.includes('quedan') || msgNormalized.includes('cupo') || msgNormalized.includes('availab')) {
      const lugares = await query("SELECT * FROM lugares");
      const tourEncontrado = lugares.find(l => {
        const nomNorm = l.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return msgNormalized.includes(nomNorm);
      });

      if (tourEncontrado) {
        const hoy = new Date().toISOString().split('T')[0];
        const resCount = await query("SELECT COUNT(*) as total FROM reservas WHERE lugar_id = ? AND (fecha >= ? OR fecha IS NULL) AND (estado IS NULL OR estado != 'cancelada')", [tourEncontrado.id, hoy]);
        const totalRegistradas = resCount[0]?.total || 0;
        const reservasRestantes = Math.max(0, 20 - totalRegistradas);

        respuesta = isEnglish
          ? `Currently for **${tourEncontrado.nombre}** there are **${reservasRestantes} reservation spots available**.\n📌 Rule: Limit is 20 reservations per place and date.`
          : `Actualmente para el tour **${tourEncontrado.nombre}** quedan **${reservasRestantes} reservas disponibles**.\n📌 Regla: El límite es de 20 reservas por lugar y fecha.`;
      } else {
        respuesta = isEnglish
          ? "At EmiTours the limit is 20 reservations per tour and date. You can check availability for any destination!"
          : "En EmiTours el límite es de 20 reservas por lugar y fecha. ¡Puedes consultarme la disponibilidad de cualquier destino!";
      }
    }

    // 12. SALUDOS E INFORMACIÓN GENERAL
    else if (msgNormalized.includes('hola') || msgNormalized.includes('buenas') || msgNormalized.includes('hello') || msgNormalized.includes('hi') || msgNormalized.includes('emitours')) {
      respuesta = isEnglish
        ? "Hello! 👋 I am the official virtual assistant of EmiTours. I can help you with real information about our tours, prices, guides, schedules, 50% initial payment, and budget recommendations. How can I help you today?"
        : "¡Hola! 👋 Soy el asistente virtual oficial de EmiTours. Puedo ayudarte con información real sobre nuestros tours, precios, guías, horarios (7:00 AM - 7:00 PM), pago inicial del 50% y recomendaciones según tu presupuesto. ¿En qué te puedo colaborar hoy?";
    }

    // 13. REGLA ESTRICTA: SI NO EXISTE INFORMACIÓN O ES DESCONOCIDA, NO INVENTAR
    else {
      respuesta = isEnglish
        ? "I do not have registered information about that topic at this time. You can contact EmiTours via WhatsApp or visit our Reservations section for more details."
        : "No tengo información registrada sobre ese tema en este momento. Puedes consultar la sección de Reservas o comunicarte con nosotros por WhatsApp para más información.";
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
