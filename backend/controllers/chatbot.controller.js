const db = require('../config/db');

// Precios oficiales sincronizados con el módulo de Reservas
const PRECIOS_TOURS = {
  "Guatapé": 250000,
  "Pablo Escobar": 150000,
  "Comuna 13": 100000,
  "City Tour": 90000,
  "Metro Cable": 80000,
  "Pueblito Paisa": 75000
};

// Descripciones bilingües de apoyo sincronizadas con el módulo de Reservas
const DESCRIPCIONES_EN = {
  "Guatapé": "Full tour of Guatapé with ascent to the majestic Piedra del Peñol, boat ride on the reservoir, and guided walk through the town of zócalos.",
  "Comuna 13": "Guided tour through Comuna 13 exploring its history of resilience, urban art, graffiti, live music, and the famous outdoor escalators.",
  "Metro Cable": "Scenic sightseeing tour using Medellín's Metro and Metrocable system, appreciating panoramic aerial views and urban connectivity.",
  "Pablo Escobar": "Historical and educational tour about the impact, memory, and social transformation of that era in Medellín.",
  "Pueblito Paisa": "Traditional visit to Cerro Nutibara discovering the architectural replica of a classic Antioquian town, local cuisine, and 360° viewpoint.",
  "City Tour": "Cultural tour through the most iconic places in downtown Medellín: Botero Plaza, Palace of Culture, and representative heritage parks."
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

// Menú de 10 preguntas oficiales
const PREGUNTAS_ES = [
  "1. ¿Qué lugares y tours ofrecen?",
  "2. ¿Cuáles son los precios de los tours?",
  "3. ¿Hay disponibilidad para Guatapé?",
  "4. ¿Cómo puedo reservar un tour?",
  "5. ¿Cuáles son los métodos de pago?",
  "6. ¿Qué horarios tienen los tours?",
  "7. ¿Qué guías turísticos tienen?",
  "8. ¿Cuáles son mis reservas?",
  "9. ¿Qué tour me recomiendan según mi presupuesto?",
  "10. ¿Cómo puedo contactar con EmiTours?"
];

const PREGUNTAS_EN = [
  "1. What places and tours do you offer?",
  "2. What are the tour prices?",
  "3. Is there availability for Guatapé?",
  "4. How can I book a tour?",
  "5. What are the payment methods?",
  "6. What schedules do the tours have?",
  "7. What tour guides do you have?",
  "8. What are my bookings?",
  "9. What tour do you recommend according to my budget?",
  "10. How can I contact EmiTours?"
];

// 1. Consultar lugares y tours
async function consultarLugares(query, isEnglish) {
  const lugares = await query("SELECT id, nombre, descripcion FROM lugares ORDER BY id ASC");
  if (!lugares || lugares.length === 0) {
    return isEnglish
      ? "There are currently no destinations registered in our system."
      : "No hay lugares registrados en el sistema en este momento.";
  }

  const items = lugares.map((l, index) => {
    const desc = isEnglish ? (DESCRIPCIONES_EN[l.nombre] || l.descripcion) : l.descripcion;
    return `${index + 1}. **${l.nombre}**\n   ${desc}`;
  }).join("\n\n");

  return isEnglish
    ? `📍 **Available Places and Tours at EmiTours:**\n\n${items}`
    : `📍 **Lugares y Tours Disponibles en EmiTours:**\n\n${items}`;
}

// 2. Consultar precios reales
async function consultarPrecios(query, isEnglish) {
  const lugares = await query("SELECT id, nombre FROM lugares ORDER BY id ASC");
  const lista = lugares.map(l => {
    const precio = getPrecioTour(l.nombre);
    const abono50 = Math.round(precio * 0.5);
    return isEnglish
      ? `• **${l.nombre}:** $${precio.toLocaleString('en-US')} COP per person (Initial 50% deposit: $${abono50.toLocaleString('en-US')} COP)`
      : `• **${l.nombre}:** $${precio.toLocaleString('es-CO')} COP por persona (Abono inicial 50%: $${abono50.toLocaleString('es-CO')} COP)`;
  }).join("\n");

  return isEnglish
    ? `💰 **Official Tour Prices at EmiTours (COP):**\n\n${lista}\n\n📌 *Note: A mandatory 50% deposit is required to confirm your booking. The remaining 50% is paid before starting the tour.*`
    : `💰 **Precios Oficiales de los Tours en EmiTours (COP):**\n\n${lista}\n\n📌 *Nota: Para confirmar tu cupo se abona el 50% inicial obligatorio. El 50% restante se cancela antes de iniciar el tour.*`;
}

// 3. Consultar disponibilidad para Guatapé
async function consultarDisponibilidadGuatape(query, fecha, isEnglish) {
  if (!fecha) {
    return {
      requiereFecha: true,
      texto: isEnglish
        ? "To check real availability for **Guatapé**, please select the date you wish to consult:"
        : "Para consultar la disponibilidad real para **Guatapé**, por favor selecciona la fecha que deseas consultar:"
    };
  }

  const fechaLimpia = String(fecha).substring(0, 10);
  const lugaresGuatape = await query("SELECT id, nombre FROM lugares WHERE nombre LIKE '%Guatap%' LIMIT 1");
  const guatapeId = lugaresGuatape[0]?.id || 3;

  const resCount = await query(
    "SELECT COUNT(*) as total FROM reservas WHERE lugar_id = ? AND fecha = ? AND (estado IS NULL OR estado != 'cancelada')",
    [guatapeId, fechaLimpia]
  );

  const totalOcupadas = resCount[0]?.total || 0;
  const cuposRestantes = Math.max(0, 20 - totalOcupadas);

  if (cuposRestantes > 0) {
    return {
      requiereFecha: false,
      texto: isEnglish
        ? `📅 **Availability for Guatapé (${fechaLimpia}):**\n\n✅ There are **${cuposRestantes} reservation spots available** (out of a 20-spot daily limit).\n\nYou can book your spot right now in the Reservations section!`
        : `📅 **Disponibilidad para Guatapé (${fechaLimpia}):**\n\n✅ Hay **${cuposRestantes} cupos de reserva disponibles** (de 20 cupos máximos por día).\n\n¡Puedes asegurar tu cupo ahora mismo desde la sección de Reservas!`
    };
  } else {
    return {
      requiereFecha: false,
      texto: isEnglish
        ? `📅 **Availability for Guatapé (${fechaLimpia}):**\n\n❌ Sorry, there are no spots available for this date (the 20-reservation daily limit has been reached). Please choose another date.`
        : `📅 **Disponibilidad para Guatapé (${fechaLimpia}):**\n\n❌ Lo sentimos, no hay cupos disponibles para esta fecha (se alcanzó el límite máximo de 20 reservas). Por favor selecciona otra fecha.`
    };
  }
}

// 4. Cómo reservar
function mostrarInstruccionesReserva(isEnglish) {
  return isEnglish
    ? "📋 **How to book a tour at EmiTours:**\n\n1. Go to the **Reservations** section from the top menu or by clicking the button below.\n2. Choose the tour you wish to experience (Guatapé, Comuna 13, etc.).\n3. Select your date, preferred schedule (7:00 AM - 7:00 PM), number of people, and tour language (Spanish or English).\n4. Choose your payment method: Nequi, PSE, Cash, or Datáfono.\n5. Pay the **mandatory 50% initial payment** (or full payment) to confirm your reservation.\n6. You will instantly receive your unique reservation code!"
    : "📋 **Pasos para realizar una reserva en EmiTours:**\n\n1. Ingresa a la sección de **Reservas** desde el menú superior o haciendo clic en el botón de abajo.\n2. Selecciona el tour que deseas realizar (Guatapé, Comuna 13, etc.).\n3. Elige la fecha, horario deseado (7:00 AM - 7:00 PM), cantidad de personas e idioma (Español o Inglés).\n4. Selecciona tu método de pago: Nequi, PSE, Efectivo o Datáfono.\n5. Realiza el **abono inicial obligatorio del 50%** (o pago total) para asegurar tus cupos.\n6. ¡Listo! Recibirás de inmediato tu código único de reserva.";
}

// 5. Métodos de pago habilitados
function consultarMetodosPago(isEnglish) {
  return isEnglish
    ? "💳 **Payment Methods Enabled at EmiTours:**\n\nWe currently accept 4 official payment methods:\n• 📱 **Nequi**\n• 🏦 **PSE**\n• 💵 **Cash payment (Pago en efectivo)**\n• 💳 **POS Terminal (Datáfono)**\n\n📌 **Payment conditions:**\n• To confirm your reservation, an **initial 50% deposit** of the total tour price is required.\n• The remaining 50% is settled before the tour begins directly with our team."
    : "💳 **Métodos de Pago Habilitados en EmiTours:**\n\nEn EmiTours aceptamos 4 métodos de pago oficiales:\n• 📱 **Nequi**\n• 🏦 **PSE**\n• 💵 **Pago en efectivo**\n• 💳 **Datáfono**\n\n📌 **Condiciones de pago:**\n• Para confirmar cualquier reserva es obligatorio abonar el **50% inicial** del valor total.\n• El 50% restante se cancela antes de iniciar el tour directamente con nuestro equipo.";
}

// 6. Horarios permitidos
function consultarHorarios(isEnglish) {
  return isEnglish
    ? "⏰ **Official Tour Schedules at EmiTours:**\n\n• Tours operate daily from **7:00 AM to 7:00 PM**.\n• Departures are scheduled in **30-minute intervals** (07:00 AM, 07:30 AM, 08:00 AM ... up to 07:00 PM).\n• You can select your preferred time slot when filling out your booking in the Reservations section."
    : "⏰ **Horarios Oficiales de Tours en EmiTours:**\n\n• Los horarios permitidos para reservar y realizar tours son de **7:00 AM a 7:00 PM**, todos los días.\n• Las salidas se programan en intervalos de **30 minutos** (07:00 AM, 07:30 AM, 08:00 AM ... hasta 07:00 PM).\n• Puedes elegir la hora exacta que prefieras al momento de completar tu reserva.";
}

// 7. Guías turísticos
async function consultarGuias(query, isEnglish) {
  const guias = await query("SELECT nombre, apellido, idioma FROM guias ORDER BY id ASC");
  if (!guias || guias.length === 0) {
    return isEnglish
      ? "There are currently no tour guides registered in our system."
      : "No hay información de guías registrados en nuestro sistema en este momento.";
  }

  const lista = guias.map(g => {
    const idiomaStr = g.idioma || (isEnglish ? "Spanish" : "Español");
    return `• **${g.nombre} ${g.apellido || ''}** — ${isEnglish ? 'Language' : 'Idioma'}: ${idiomaStr}`;
  }).join("\n");

  return isEnglish
    ? `👥 **Our Official Certified Tour Guides at EmiTours:**\n\n${lista}\n\nOur local guides are trained to give you an unforgettable and safe experience.`
    : `👥 **Nuestros Guías Turísticos Oficiales en EmiTours:**\n\n${lista}\n\nNuestros guías locales están capacitados para brindarte una experiencia inolvidable y segura.`;
}

// 8. Mis reservas (usuario autenticado)
async function consultarMisReservas(query, usuarioId, isEnglish) {
  const sql = `
    SELECT 
      r.id,
      r.codigo,
      r.fecha,
      r.hora,
      r.numero_personas,
      r.estado,
      r.estado_pago,
      r.precio_total,
      l.nombre as tour_nombre
    FROM reservas r
    LEFT JOIN lugares l ON r.lugar_id = l.id
    WHERE r.usuario_id = ?
    ORDER BY r.id DESC
  `;

  const reservas = await query(sql, [usuarioId]);

  if (!reservas || reservas.length === 0) {
    return isEnglish
      ? "You currently have no reservations registered in your account. You can explore our destinations and book whenever you are ready!"
      : "No tienes reservas registradas actualmente en tu cuenta. Puedes explorar nuestros destinos y realizar una reserva cuando desees.";
  }

  const items = reservas.map(r => {
    const fechaStr = r.fecha instanceof Date ? r.fecha.toISOString().split('T')[0] : String(r.fecha || 'N/A').substring(0, 10);
    const horaStr = String(r.hora || 'N/A').substring(0, 5);
    const estadoStr = (r.estado || 'pendiente').toUpperCase();
    const estadoPagoStr = (r.estado_pago || 'pendiente').toUpperCase();

    return isEnglish
      ? `• **Tour:** ${r.tour_nombre || 'EmiTours'}\n  **Code:** \`${r.codigo}\`\n  **Date:** ${fechaStr} | **Time:** ${horaStr}\n  **People:** ${r.numero_personas}\n  **Status:** ${estadoStr}\n  **Payment Status:** ${estadoPagoStr}`
      : `• **Tour:** ${r.tour_nombre || 'EmiTours'}\n  **Código:** \`${r.codigo}\`\n  **Fecha:** ${fechaStr} | **Hora:** ${horaStr}\n  **Personas:** ${r.numero_personas}\n  **Estado:** ${estadoStr}\n  **Estado del Pago:** ${estadoPagoStr}`;
  }).join("\n\n");

  return isEnglish
    ? `📋 **Your Registered Bookings at EmiTours:**\n\n${items}`
    : `📋 **Tus Reservas Registradas en EmiTours:**\n\n${items}`;
}

// 9. Recomendación según presupuesto
async function consultarPresupuesto(query, presupuesto, isEnglish) {
  if (presupuesto === undefined || presupuesto === null || isNaN(presupuesto) || presupuesto <= 0) {
    return {
      requierePresupuesto: true,
      texto: isEnglish
        ? "¿What is your budget for taking a tour? Please enter the amount in Colombian pesos (Example: 100000):"
        : "¿Cuál es tu presupuesto para realizar un tour? Por favor ingresa la cantidad en pesos colombianos (Ejemplo: 100000):"
    };
  }

  const lugares = await query("SELECT id, nombre, descripcion FROM lugares ORDER BY id ASC");
  const toursConPrecio = lugares.map(l => ({
    nombre: l.nombre,
    precio: getPrecioTour(l.nombre),
    descripcion: isEnglish ? (DESCRIPCIONES_EN[l.nombre] || l.descripcion) : l.descripcion
  }));

  const recomendados = toursConPrecio.filter(t => t.precio <= presupuesto);

  if (recomendados.length === 0) {
    return {
      requierePresupuesto: false,
      texto: isEnglish
        ? `💡 For a budget of $${presupuesto.toLocaleString('en-US')} COP we did not find available tours. Our most affordable tour starts at **$75,000 COP** (Pueblito Paisa).`
        : `💡 Para un presupuesto de $${presupuesto.toLocaleString('es-CO')} COP no encontramos tours disponibles. Actualmente el tour más económico inicia en **$75.000 COP** (Pueblito Paisa).`
    };
  }

  const lista = recomendados.map(t => {
    return isEnglish
      ? `• **${t.nombre}** — $${t.precio.toLocaleString('en-US')} COP per person\n  ${t.descripcion}`
      : `• **${t.nombre}** — $${t.precio.toLocaleString('es-CO')} COP por persona\n  ${t.descripcion}`;
  }).join("\n\n");

  return {
    requierePresupuesto: false,
    texto: isEnglish
      ? `💡 **Tours recommended for your budget of $${presupuesto.toLocaleString('en-US')} COP:**\n\n${lista}`
      : `💡 **Tours recomendados para tu presupuesto de $${presupuesto.toLocaleString('es-CO')} COP:**\n\n${lista}`
  };
}

// 10. Contacto oficial
function mostrarContacto(isEnglish) {
  return isEnglish
    ? "📞 **Official Contact Channels for EmiTours:**\n\n• 📱 **Official WhatsApp:** [+57 301 864 0872](https://wa.me/573018640872)\n• ✉️ **Email:** lopezmariafabiola93@gmail.com\n• 🌐 **Website:** Contact section in the top menu\n• ⏰ **Customer Support Hours:** Monday to Sunday, 7:00 AM - 7:00 PM\n\nYou can click the button below to start a direct chat with us on WhatsApp!"
    : "📞 **Medios Oficiales de Contacto de EmiTours:**\n\n• 📱 **WhatsApp Oficial:** [+57 301 864 0872](https://wa.me/573018640872)\n• ✉️ **Correo electrónico:** lopezmariafabiola93@gmail.com\n• 🌐 **Página web:** Sección de Contacto en el menú superior\n• ⏰ **Horario de atención:** Lunes a Domingo, 7:00 AM - 7:00 PM\n\n¡Puedes hacer clic en el botón de abajo para comunicarte directamente con nosotros por WhatsApp!";
}

// PROCESAR MENSAJE DEL CHATBOT EXCLUSIVAMENTE POR MENÚ ENUMERADO (1 - 10)
exports.procesarMensaje = async (req, res) => {
  const usuarioId = req.user?.id || req.user?.id_registro;
  const { mensaje, opcion: opcionParam, fecha, presupuesto, language } = req.body;
  const isEnglish = (language === 'en');

  if (!usuarioId) {
    return res.status(401).json({
      status: 'ERROR',
      mensaje: isEnglish
        ? 'To use the virtual assistant of EmiTours you must register and log in.'
        : 'Para utilizar el asistente virtual de EmiTours debes registrarte e iniciar sesión.'
    });
  }

  try {
    const query = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, r) => err ? reject(err) : resolve(r));
    });

    const preguntasList = isEnglish ? PREGUNTAS_EN : PREGUNTAS_ES;

    // Determinar opción seleccionada (0 a 10)
    let opcionSeleccionada = null;

    if (opcionParam !== undefined && opcionParam !== null && opcionParam !== "") {
      const num = parseInt(opcionParam, 10);
      if (!isNaN(num) && num >= 0 && num <= 10) {
        opcionSeleccionada = num;
      }
    }

    const textoRaw = (mensaje || "").trim();

    if (opcionSeleccionada === null && textoRaw) {
      // Verificar si el usuario escribió exactamente un número de 0 a 10
      if (/^(?:[0-9]|10)$/.test(textoRaw)) {
        opcionSeleccionada = parseInt(textoRaw, 10);
      } else {
        // Verificar si empieza por "1.", "2.", ... "10."
        const matchPrefijo = textoRaw.match(/^(?:([0-9]|10))\s*[\.\-\)]/);
        if (matchPrefijo) {
          opcionSeleccionada = parseInt(matchPrefijo[1], 10);
        }
      }
    }

    // Si aún no hay opción, verificar si es respuesta de presupuesto o fecha para una opción activa
    if (opcionSeleccionada === null) {
      if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(String(fecha).trim())) {
        opcionSeleccionada = 3;
      } else if (presupuesto !== undefined && presupuesto !== null && !isNaN(Number(presupuesto))) {
        opcionSeleccionada = 9;
      } else {
        // Verificar si el texto es puramente un número de presupuesto (ej: 100000 o 50000)
        const soloDigitos = textoRaw.replace(/[\$\.,\sCOPcop]/gi, '');
        if (/^\d{4,9}$/.test(soloDigitos)) {
          opcionSeleccionada = 9;
        }
      }
    }

    // SI EL USUARIO ESCRIBIÓ ALGO DIFERENTE A 1 - 10 (O 0):
    // Condición obligatoria: No permitir preguntas libres, avisar y volver a mostrar el menú
    if (opcionSeleccionada === null) {
      const respuestaInvalida = isEnglish
        ? "Please select a number from 1 to 10 so I can help you. 😊"
        : "Por favor, selecciona un número del 1 al 10 para que pueda ayudarte. 😊";

      // Guardar en MySQL
      await query("INSERT INTO chatbot_conversaciones (usuario_id, mensaje_usuario, respuesta_ia) VALUES (?, ?, ?)", [
        usuarioId, textoRaw || "Pregunta libre", respuestaInvalida
      ]);

      return res.json({
        status: 'OK',
        esInvalido: true,
        respuesta: respuestaInvalida,
        preguntas: preguntasList,
        mostrarMenu: true
      });
    }

    // OPCIÓN 0: Volver al menú principal
    if (opcionSeleccionada === 0) {
      const mensajeBienvenida = isEnglish
        ? "Hello! 👋 Welcome to EmiTours virtual assistant.\n\nI am here to help you learn about our services.\n\nSelect the number of the question you want to ask:"
        : "¡Hola! 👋 Bienvenido al asistente virtual de EmiTours.\n\nEstoy aquí para ayudarte a conocer nuestros servicios.\n\nSelecciona el número de la pregunta que deseas consultar:";

      return res.json({
        status: 'OK',
        opcion: 0,
        respuesta: mensajeBienvenida,
        preguntas: preguntasList,
        mostrarMenu: true
      });
    }

    let respuestaTexto = "";
    let requiereFecha = false;
    let requierePresupuesto = false;
    let accion = null;
    let preguntaCompleta = preguntasList[opcionSeleccionada - 1] || `${opcionSeleccionada}. Consulta`;

    switch (opcionSeleccionada) {
      case 1:
        respuestaTexto = await consultarLugares(query, isEnglish);
        break;

      case 2:
        respuestaTexto = await consultarPrecios(query, isEnglish);
        break;

      case 3: {
        const fechaAConsultar = fecha || (textoRaw.match(/\d{4}-\d{2}-\d{2}/) ? textoRaw.match(/\d{4}-\d{2}-\d{2}/)[0] : null);
        const resDisponibilidad = await consultarDisponibilidadGuatape(query, fechaAConsultar, isEnglish);
        respuestaTexto = resDisponibilidad.texto;
        requiereFecha = resDisponibilidad.requiereFecha;
        if (fechaAConsultar) {
          preguntaCompleta += ` [Fecha: ${fechaAConsultar}]`;
        }
        break;
      }

      case 4:
        respuestaTexto = mostrarInstruccionesReserva(isEnglish);
        accion = { tipo: "ir_reservas", url: "/reservas", texto: isEnglish ? "Go to Reservations" : "Ir a la sección de Reservas" };
        break;

      case 5:
        respuestaTexto = consultarMetodosPago(isEnglish);
        break;

      case 6:
        respuestaTexto = consultarHorarios(isEnglish);
        break;

      case 7:
        respuestaTexto = await consultarGuias(query, isEnglish);
        break;

      case 8:
        respuestaTexto = await consultarMisReservas(query, usuarioId, isEnglish);
        break;

      case 9: {
        let montoPresupuesto = null;
        if (presupuesto !== undefined && presupuesto !== null && !isNaN(Number(presupuesto))) {
          montoPresupuesto = Number(presupuesto);
        } else {
          const matchNum = textoRaw.replace(/[\$\.,\sCOPcop]/gi, '');
          if (/^\d{4,9}$/.test(matchNum)) {
            montoPresupuesto = parseInt(matchNum, 10);
          }
        }

        const resPresupuesto = await consultarPresupuesto(query, montoPresupuesto, isEnglish);
        respuestaTexto = resPresupuesto.texto;
        requierePresupuesto = resPresupuesto.requierePresupuesto;
        if (montoPresupuesto) {
          preguntaCompleta += ` [Presupuesto: $${montoPresupuesto.toLocaleString()} COP]`;
        }
        break;
      }

      case 10:
        respuestaTexto = mostrarContacto(isEnglish);
        accion = {
          tipo: "abrir_whatsapp",
          url: "https://wa.me/573018640872",
          texto: isEnglish ? "Chat on WhatsApp (+57 301 864 0872)" : "Chatear por WhatsApp (+57 301 864 0872)"
        };
        break;

      default:
        respuestaTexto = isEnglish
          ? "Please select a number from 1 to 10 so I can help you. 😊"
          : "Por favor, selecciona un número del 1 al 10 para que pueda ayudarte. 😊";
        break;
    }

    // Guardar conversación completa en la base de datos MySQL
    // (Solo si no es una solicitud intermedia de fecha o presupuesto para no duplicar historiales vacíos)
    if (!requiereFecha && !requierePresupuesto) {
      await query("INSERT INTO chatbot_conversaciones (usuario_id, mensaje_usuario, respuesta_ia) VALUES (?, ?, ?)", [
        usuarioId, preguntaCompleta, respuestaTexto
      ]);
    }

    res.json({
      status: 'OK',
      opcion: opcionSeleccionada,
      pregunta: preguntaCompleta,
      respuesta: respuestaTexto,
      requiereFecha,
      requierePresupuesto,
      accion,
      mostrarBotonVolver: true
    });

  } catch (err) {
    console.error("Error en ChatBot controller:", err);
    res.status(500).json({
      status: 'ERROR',
      mensaje: isEnglish
        ? 'Error processing assistant query.'
        : 'Error al procesar la consulta con el asistente virtual.'
    });
  }
};

// VISTAS Y CONFIGURACIÓN ADMIN
exports.getHistorialAdmin = (req, res) => {
  db.query("SELECT c.*, u.nombre_usuario, u.correo_electronico FROM chatbot_conversaciones c LEFT JOIN registro_usuarios u ON c.usuario_id = u.id_registro ORDER BY c.id DESC LIMIT 100", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

