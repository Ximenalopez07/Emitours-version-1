import React, { useState, useEffect, useContext } from "react";
import { UIContext } from "../context/UIContext";
import { getLugares, getReservas, createReserva, crearPreferenciaMP, verificarPagoMP, getUltimoPagoMP } from "../api";
import { translations } from "../utils/translations";
import "./reservas.css";

// MÉTODOS DE PAGO PERMITIDOS (ÚNICAMENTE NEQUI Y PSE)
const METODOS_PAGO_PERMITIDOS = ['Nequi', 'PSE'];

// LISTADO DE HORARIOS EN INTERVALOS DE 30 MINUTOS (07:00 AM - 07:00 PM)
const HORARIOS_DISPONIBLES = [
  "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
  "07:00 PM"
];

// =========================================================================
// CONFIGURACIÓN INDEPENDIENTE DE TOURS PARA LA PÁGINA DE RESERVAS
// Modifica aquí fácilmente: nombre, descripción, precio, duración y cupos
// de cada tour sin depender ni alterar la tabla 'lugares'.
// =========================================================================
export const configuracionTours = {
  "Guatapé": {
    descripcion: "Tour completo por Guatapé con ascenso a la majestuosa Piedra del Peñol, recorrido en barco por el embalse y caminata guiada por el pueblo de los zócalos.",
    descripcion_en: "Full tour of Guatapé with ascent to the majestic Piedra del Peñol, boat ride on the reservoir, and guided walk through the town of zócalos.",
    precio: 250000,
    duracion: "8 Horas",
    duracion_en: "8 Hours",
    cupos: 20
  },
  "Comuna 13": {
    descripcion: "Recorrido guiado por la Comuna 13 para conocer su historia de resiliencia, arte urbano, graffitis, música en vivo y las famosas escaleras eléctricas.",
    descripcion_en: "Guided tour through Comuna 13 to explore its history of resilience, urban art, graffiti, live music, and the famous outdoor escalators.",
    precio: 100000,
    duracion: "4 Horas",
    duracion_en: "4 Hours",
    cupos: 20
  },
  "Metro Cable": {
    descripcion: "Recorrido turístico panorámico utilizando el sistema Metro y Metrocable de Medellín, apreciando las vistas y la conectividad urbana.",
    descripcion_en: "Scenic sightseeing tour using Medellín's Metro and Metrocable system, appreciating aerial views and urban connectivity.",
    precio: 80000,
    duracion: "3 Horas",
    duracion_en: "3 Hours",
    cupos: 20
  },
  "Pablo Escobar": {
    descripcion: "Tour histórico e informativo sobre el impacto, la memoria y la transformación social de la época de Pablo Escobar en Medellín.",
    descripcion_en: "Using drug trafficking money and with his political and criminal aspirations present, Pablo Escobar decided to offer \"free houses\" to the homeless and the poorest of Medellín by ordering the initial construction of 250 houses for families who lived in the municipal garbage dump. The National Government ordered them demolished upon learning they came from drug trafficking.",
    precio: 150000,
    duracion: "4 Horas",
    duracion_en: "4 Hours",
    cupos: 20
  },
  "Pueblito Paisa": {
    descripcion: "Visita tradicional al Cerro Nutibara conociendo la réplica arquitectónica del pueblo antioqueño, gastronomía típica y mirador panorámico 360°.",
    descripcion_en: "Traditional visit to Cerro Nutibara discovering the architectural replica of a classic Antioquian town, local cuisine, and 360° scenic viewpoint.",
    precio: 75000,
    duracion: "2 Horas",
    duracion_en: "2 Hours",
    cupos: 20
  },
  "City Tour": {
    descripcion: "Recorrido cultural por los sitios más icónicos del centro de Medellín: Plaza Botero, Palacio de la Cultura y parques representativos.",
    descripcion_en: "Cultural tour through the most iconic places in downtown Medellín: Botero Plaza, Palace of Culture, and representative heritage parks.",
    precio: 90000,
    duracion: "4 Horas",
    duracion_en: "4 Hours",
    cupos: 20
  }
};

// Función auxiliar para obtener la configuración de un tour por su nombre
export const obtenerConfigTour = (nombre) => {
  if (!nombre) return null;
  if (configuracionTours[nombre]) return configuracionTours[nombre];

  // Búsqueda flexible (sin tildes, sin distinción de mayúsculas/minúsculas)
  const nomNorm = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  for (const [key, config] of Object.entries(configuracionTours)) {
    const keyNorm = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (nomNorm === keyNorm || nomNorm.includes(keyNorm) || keyNorm.includes(nomNorm)) {
      return config;
    }
  }
  return null;
};

const Reservas = () => {
  const { user, language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  const [tours, setTours] = useState([
    {
      id: 1,
      nombre: "Pablo Escobar",
      imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlnxh8O5vDMUrQWb0J8T-WDK-yHu9q_DHWZg&s",
      ...(obtenerConfigTour("Pablo Escobar") || { precio: 150000, duracion: "4 Horas", duracion_en: "4 Hours", cupos: 20, descripcion: "Tour histórico.", descripcion_en: "Historical tour." })
    },
    {
      id: 2,
      nombre: "Comuna 13",
      imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJFj3Gneuspnt1RUvzE8zelO98GAvkhGw1sg&s",
      ...(obtenerConfigTour("Comuna 13") || { precio: 100000, duracion: "4 Horas", duracion_en: "4 Hours", cupos: 20, descripcion: "Recorrido Comuna 13.", descripcion_en: "Comuna 13 tour." })
    },
    {
      id: 3,
      nombre: "Guatapé",
      imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9f2DxLn5Q8C_wFSmTg8iUxq1lQd6KlxbsAg&s",
      ...(obtenerConfigTour("Guatapé") || { precio: 250000, duracion: "8 Horas", duracion_en: "8 Hours", cupos: 20, descripcion: "Tour Guatapé.", descripcion_en: "Guatapé tour." })
    },
    {
      id: 4,
      nombre: "Pueblito Paisa",
      imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSw4ZCUmpQS_mT3D5EqAIVMapoqLZ83EcSuA&s",
      ...(obtenerConfigTour("Pueblito Paisa") || { precio: 75000, duracion: "2 Horas", duracion_en: "2 Hours", cupos: 20, descripcion: "Visita Pueblito Paisa.", descripcion_en: "Pueblito Paisa visit." })
    },
    {
      id: 5,
      nombre: "City Tour",
      imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzZTpJR8aQt929h3wrN543y_gDCQxczoTRmA&s",
      ...(obtenerConfigTour("City Tour") || { precio: 90000, duracion: "4 Horas", duracion_en: "4 Hours", cupos: 20, descripcion: "City Tour Medellín.", descripcion_en: "Medellín City Tour." })
    },
    {
      id: 6,
      nombre: "Metro Cable",
      imagen: "https://getvico.com/blog/wp-content/uploads/2018/01/Metrocable.jpg",
      ...(obtenerConfigTour("Metro Cable") || { precio: 80000, duracion: "3 Horas", duracion_en: "3 Hours", cupos: 20, descripcion: "Tour Metrocable.", descripcion_en: "Metrocable tour." })
    }
  ]);

  const [selectedTour, setSelectedTour] = useState(null);
  const [misReservas, setMisReservas] = useState([]);

  // CAMPOS FORMULARIO
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [celular, setCelular] = useState("");
  const [numeroPersonas, setNumeroPersonas] = useState(1);
  const [fechaTour, setFechaTour] = useState("");
  const [horaTour, setHoraTour] = useState("07:00 AM");
  const [idiomaTour, setIdiomaTour] = useState("es");
  const [tipoPago, setTipoPago] = useState("total"); // "total" (100%) o "50" (50%)
  const [metodoPago, setMetodoPago] = useState("Nequi");
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorForm, setErrorForm] = useState(null);

  // ESTADOS MERCADO PAGO CHECKOUT PRO
  const [pagoVerificado, setPagoVerificado] = useState(null); // { paymentId, aprobado, pendiente, rechazado, monto, ya_utilizado, detalle }
  const [cargandoMP, setCargandoMP] = useState(false);
  const [verificandoMP, setVerificandoMP] = useState(false);
  const [inputPaymentIdManual, setInputPaymentIdManual] = useState("");
  const [borradorPendiente, setBorradorPendiente] = useState(null);
  const [guardandoReserva, setGuardandoReserva] = useState(false);

  useEffect(() => {
    if (!user) {
      setMisReservas([]);
      setNombreCompleto("");
      setCelular("");
    }
    cargarDatos();

    // Capturar retorno automático de Mercado Pago desde la URL
    const queryParams = new URLSearchParams(window.location.search);
    const paymentIdUrl = queryParams.get("payment_id") || queryParams.get("collection_id");
    const statusUrl = queryParams.get("status") || queryParams.get("collection_status");

    if (paymentIdUrl) {
      verificarRetornoMercadoPago(paymentIdUrl, statusUrl);
      // Limpiar parámetros de la URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Si no hay parámetros en la URL, verificar si quedó un borrador en proceso
      const tempJson = sessionStorage.getItem("emitours_temp_reserva");
      if (tempJson) {
        try {
          const parsed = JSON.parse(tempJson);
          setBorradorPendiente(parsed);
        } catch (e) {}
      }
    }
  }, [user]);

  const verificarRetornoMercadoPago = async (pId, stUrl) => {
    setVerificandoMP(true);
    setErrorForm(null);
    try {
      // 1. Restaurar datos del borrador de reserva si existen en sessionStorage
      const tempJson = sessionStorage.getItem("emitours_temp_reserva");
      let temp = null;
      let tempTour = null;
      if (tempJson) {
        try {
          temp = JSON.parse(tempJson);
          if (temp.nombreCompleto) setNombreCompleto(temp.nombreCompleto);
          if (temp.celular) setCelular(temp.celular);
          if (temp.numeroPersonas) setNumeroPersonas(temp.numeroPersonas);
          if (temp.fechaTour) setFechaTour(temp.fechaTour);
          if (temp.horaTour) setHoraTour(temp.horaTour);
          if (temp.idiomaTour) setIdiomaTour(temp.idiomaTour);
          if (temp.tipoPago) setTipoPago(temp.tipoPago);
          if (temp.metodoPago) setMetodoPago(temp.metodoPago);

          tempTour = tours.find(t => String(t.id) === String(temp.tourId)) || {
            id: temp.tourId,
            nombre: temp.tourNombre || "Tour seleccionado",
            precio: temp.precioUnitario || 100000
          };
          setSelectedTour(tempTour);
        } catch (e) {
          console.warn("No se pudo parsear el borrador de reserva", e);
        }
      }

      // 2. Consultar directamente al backend para verificar el estado real con Mercado Pago
      const res = await verificarPagoMP(pId);
      if (res.data && res.data.status === "OK") {
        const info = res.data;
        const yaUtilizado = !!info.ya_utilizado;

        // Si el borrador no estaba en sessionStorage, reconstruir los datos desde la metadata de Mercado Pago
        if (!temp && info.metadata && Object.keys(info.metadata).length > 0) {
          const meta = info.metadata;
          if (meta.numero_personas) setNumeroPersonas(meta.numero_personas);
          if (meta.fecha) setFechaTour(meta.fecha);
          if (meta.hora) setHoraTour(meta.hora);
          if (meta.idioma) setIdiomaTour(meta.idioma);
          if (meta.tipo_pago) setTipoPago(meta.tipo_pago === 'total' ? 'total' : '50');
          if (meta.metodo_pago) setMetodoPago(meta.metodo_pago);

          const foundTour = tours.find(t => String(t.id) === String(meta.lugar_id));
          if (foundTour) {
            setSelectedTour(foundTour);
          }
        }

        setPagoVerificado({
          paymentId: pId,
          aprobado: !!info.aprobado,
          pendiente: !!info.pendiente,
          rechazado: !!info.rechazado,
          monto: info.monto,
          metodo_pago: info.metodo_pago,
          status_detail: info.status_detail,
          ya_utilizado: yaUtilizado,
          reserva: info.reserva
        });

        // Caso 1: La transacción ya fue utilizada previamente en una reserva
        if (yaUtilizado) {
          setErrorForm(
            language === 'en'
              ? `This payment transaction (#${pId}) is already linked to reservation ${info.reserva?.codigo || ''}. Check 'My Bookings' below.`
              : `Esta transacción de Mercado Pago (#${pId}) ya está vinculada a la reserva ${info.reserva?.codigo || ''}. Puedes consultarla en la sección 'Mis Reservas' abajo.`
          );
          sessionStorage.removeItem("emitours_temp_reserva");
          setBorradorPendiente(null);
          return;
        }

        // Caso 2: Pago Aprobado o Pendiente de Acreditación (Bancolombia / Efecty / PSE)
        if (info.aprobado || info.pendiente) {
          // El pago está autenticado y verificado con Mercado Pago.
          // El formulario conserva todos los datos y permanece ABIERTO para que el usuario pulse "Confirmar reserva".
          setErrorForm(null);
        }

        // Caso 3: Pago Rechazado
        if (info.rechazado) {
          setErrorForm(
            language === 'en'
              ? `The payment was rejected by Mercado Pago (${info.status_detail || 'not authorized'}). The booking was not created. You can retry with another payment method.`
              : `El pago fue rechazado por Mercado Pago (${info.status_detail || 'no autorizado'}). La reserva no fue creada. Puedes intentar con otro medio de pago.`
          );
        }
      } else {
        setErrorForm("No se pudo verificar la transacción con Mercado Pago: " + (res.data?.mensaje || ""));
      }
    } catch (err) {
      console.error("Error al verificar retorno de Mercado Pago:", err);
      const msgErr = err.response?.data?.mensaje || err.message;
      setErrorForm("Error al verificar transacción con Mercado Pago: " + msgErr);
    } finally {
      setVerificandoMP(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const resTours = await getLugares();
      if (resTours.data && resTours.data.length > 0) {
        // Enlazar los lugares del backend con la configuración independiente de Reservas
        const toursActualizados = resTours.data.map(lugar => {
          const config = obtenerConfigTour(lugar.nombre) || {};
          return {
            id: lugar.id,
            nombre: lugar.nombre,
            imagen: lugar.imagen,
            // La descripción de Reservas es INDEPENDIENTE de lugar.descripcion
            descripcion: config.descripcion || lugar.descripcion || 'Tour guiado por Medellín y sus alrededores.',
            descripcion_en: config.descripcion_en || config.descripcion || lugar.descripcion,
            precio: typeof config.precio === 'number' ? config.precio : 100000,
            duracion: config.duracion || '4 Horas',
            duracion_en: config.duracion_en || '4 Hours',
            cupos: config.cupos || 20
          };
        });
        setTours(toursActualizados);
      }
    } catch (e) {
      console.warn("Usando tours por defecto");
    }

    const currentUsr = user || (localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")) : null);
    if (currentUsr) {
      try {
        const resMisRes = await getReservas({ usuario_id: currentUsr.id_registro || currentUsr.id });
        if (resMisRes.data) {
          setMisReservas(resMisRes.data);
        }
      } catch (e) {
        console.error("Error al cargar historial de reservas", e);
      }
    }
  };

  const handleDetectarUltimoPago = async () => {
    setVerificandoMP(true);
    setErrorForm(null);
    try {
      const res = await getUltimoPagoMP();
      if (res.data && res.data.paymentId) {
        await verificarRetornoMercadoPago(res.data.paymentId, res.data.estado_mp);
      } else {
        setErrorForm("No se encontró ningún pago reciente en Mercado Pago Sandbox.");
      }
    } catch (err) {
      console.error(err);
      setErrorForm("Error al buscar último pago: " + (err.response?.data?.mensaje || err.message));
    } finally {
      setVerificandoMP(false);
    }
  };

  const abrirFormularioReserva = (tour) => {
    const usuarioActual = user || (localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")) : null);
    if (!usuarioActual) {
      alert(t.chatbot_auth_requerida || "Debes iniciar sesión para realizar una reserva.");
      return;
    }
    setSelectedTour(tour);
    setNombreCompleto(usuarioActual.nombre_usuario || usuarioActual.nombre || "Usuario");
    setCelular(usuarioActual.telefono || usuarioActual.celular || "");
    setNumeroPersonas(1);
    setFechaTour("");
    setHoraTour("07:00 AM");
    setIdiomaTour("es");
    setTipoPago("total");
    setMetodoPago("Nequi");
    setMensajeExito(null);
    setErrorForm(null);
    setPagoVerificado(null);
    setCargandoMP(false);
  };

  const handleIniciarPagoMercadoPago = async () => {
    setErrorForm(null);

    const usuarioActual = user || (localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")) : null);
    const usuarioId = usuarioActual?.id_registro || usuarioActual?.id || usuarioActual?.id_usuario;

    if (!usuarioId) {
      setErrorForm(language === 'en' ? 'You must be logged in to make a payment.' : 'Debes iniciar sesión para realizar el pago.');
      return;
    }

    if (!selectedTour) {
      setErrorForm(language === 'en' ? 'Please select a tour.' : 'Por favor selecciona un tour.');
      return;
    }

    if (!fechaTour) {
      setErrorForm(language === 'en' ? 'Please select the tour date first.' : 'Por favor selecciona primero la fecha del tour.');
      return;
    }

    const cantidadPersonas = parseInt(numeroPersonas, 10);
    if (isNaN(cantidadPersonas) || cantidadPersonas < 1) {
      setErrorForm(language === 'en' ? 'Please specify at least 1 person.' : 'Por favor indica al menos 1 persona.');
      return;
    }

    setCargandoMP(true);

    try {
      const precioUnitario = typeof selectedTour.precio === 'number' ? selectedTour.precio : 100000;
      const esPagoTotal = (tipoPago === 'total');

      // Guardar el borrador en sessionStorage para restaurarlo al regresar del checkout
      const borrador = {
        tourId: selectedTour.id,
        tourNombre: selectedTour.nombre || selectedTour.title,
        precioUnitario,
        nombreCompleto,
        celular,
        numeroPersonas: cantidadPersonas,
        fechaTour,
        horaTour: horaTour || "07:00 AM",
        idiomaTour: idiomaTour || "es",
        tipoPago,
        metodoPago
      };
      sessionStorage.setItem("emitours_temp_reserva", JSON.stringify(borrador));

      // Crear la preferencia en el backend
      const res = await crearPreferenciaMP({
        usuario_id: usuarioId,
        nombre_completo: nombreCompleto,
        celular: celular,
        lugar_id: selectedTour.id,
        numero_personas: cantidadPersonas,
        fecha: fechaTour,
        hora: horaTour || "07:00 AM",
        idioma: idiomaTour || "es",
        tipo_pago: tipoPago,
        metodo_pago: metodoPago
      });

      if (res.data && res.data.status === 'OK') {
        const urlCheckout = res.data.checkoutUrl || res.data.sandboxInitPoint || res.data.initPoint;
        if (urlCheckout) {
          // Redirigir al Checkout Pro oficial de Mercado Pago (Sandbox)
          window.location.href = urlCheckout;
        } else {
          setErrorForm("No se recibió la URL de redirección del checkout de Mercado Pago.");
          setCargandoMP(false);
        }
      } else {
        setErrorForm(res.data?.mensaje || "Error al generar la preferencia de pago en Mercado Pago.");
        setCargandoMP(false);
      }
    } catch (err) {
      console.error("Error al iniciar checkout Mercado Pago:", err);
      let msg = err.response?.data?.mensaje;
      if (!msg) {
        if (err.response?.status === 404) {
          msg = language === 'en'
            ? 'The payment endpoint was not found (404). Please restart the backend server so it loads the new Mercado Pago routes.'
            : 'El servicio de pago no fue encontrado (Error 404). Por favor reinicia el servidor backend para que cargue las nuevas rutas de Mercado Pago.';
        } else {
          msg = err.message || "Error al conectar con Mercado Pago";
        }
      }
      setErrorForm(msg);
      setCargandoMP(false);
    }
  };

  const handleSubmitReserva = async (e) => {
    e.preventDefault();
    setErrorForm(null);

    const usuarioActual = user || (localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")) : null);
    const usuarioId = usuarioActual?.id_registro || usuarioActual?.id || usuarioActual?.id_usuario;

    if (!usuarioId) {
      setErrorForm(language === 'en' ? 'You must be logged in to make a reservation.' : 'Debes iniciar sesión para realizar una reserva.');
      return;
    }

    if (!selectedTour) {
      setErrorForm(language === 'en' ? 'Please select a tour.' : 'Por favor selecciona un tour.');
      return;
    }

    if (!fechaTour) {
      setErrorForm(language === 'en' ? 'Please select the tour date.' : 'Por favor selecciona la fecha del tour.');
      return;
    }

    // ========================================================
    // REGLA: PAGO APROBADO O EN PROCESO (EFECTY / BANCOLOMBIA / PSE)
    // ========================================================
    if (!pagoVerificado || (!pagoVerificado.aprobado && !pagoVerificado.pendiente)) {
      setErrorForm(
        language === 'en' 
          ? 'You must complete or initiate the payment on Mercado Pago before confirming the booking.' 
          : 'Debes completar o iniciar el pago con Mercado Pago antes de confirmar la reserva.'
      );
      return;
    }

    if (pagoVerificado.ya_utilizado) {
      setErrorForm(
        language === 'en'
          ? 'This Mercado Pago transaction has already been used for another booking.'
          : 'Esta transacción de Mercado Pago ya fue utilizada para confirmar una reserva.'
      );
      return;
    }

    const cantidadPersonas = parseInt(numeroPersonas, 10);
    if (isNaN(cantidadPersonas) || cantidadPersonas < 1) {
      setErrorForm(language === 'en' ? 'Please specify at least 1 person.' : 'Por favor indica al menos 1 persona.');
      return;
    }

    const idiomaFinal = (idiomaTour === "en" || idiomaTour === "es") ? idiomaTour : "es";
    const horaFinal = horaTour || "07:00 AM";
    const metodoPagoFinal = metodoPago || "Nequi";

    const precioUnitario = typeof selectedTour.precio === 'number' ? selectedTour.precio : 100000;
    const precioTotalCalculado = precioUnitario * cantidadPersonas;
    const esPagoTotal = (tipoPago === 'total');
    const pagoInicialCalculado = esPagoTotal ? precioTotalCalculado : Math.round(precioTotalCalculado * 0.5);
    const saldoPendienteCalculado = esPagoTotal ? 0 : (precioTotalCalculado - pagoInicialCalculado);

    try {
      setGuardandoReserva(true);
      const payload = {
        usuario_id: usuarioId,
        nombre_completo: nombreCompleto,
        celular: celular,
        lugar_id: selectedTour.id,
        numero_personas: cantidadPersonas,
        fecha: fechaTour,
        hora: horaFinal,
        idioma: idiomaFinal,
        metodo_pago: metodoPagoFinal,
        opcion_pago: esPagoTotal ? "Pagar el total" : "Pagar el 50%",
        precio_total: precioTotalCalculado,
        mp_payment_id: pagoVerificado.paymentId,
        monto_abonado: pagoVerificado.monto || pagoInicialCalculado
      };

      const res = await createReserva(payload);

      if (res.data && res.data.status === 'OK') {
        const codigoGen = res.data.codigo || `RES-${Math.floor(100000 + Math.random() * 900000)}`;
        setMensajeExito({
          codigo: codigoGen,
          tourNombre: selectedTour.nombre || selectedTour.title,
          fecha: fechaTour,
          hora: horaFinal,
          personas: cantidadPersonas,
          idioma: idiomaFinal,
          metodo: `Mercado Pago (${pagoVerificado.metodo_pago ? pagoVerificado.metodo_pago.toUpperCase() : metodoPagoFinal})`,
          total: precioTotalCalculado,
          pagoInicial: res.data.monto_pagado !== undefined ? res.data.monto_pagado : (pagoVerificado.aprobado ? (pagoVerificado.monto || pagoInicialCalculado) : 0),
          saldoPendiente: res.data.saldo_pendiente !== undefined ? res.data.saldo_pendiente : (pagoVerificado.aprobado ? saldoPendienteCalculado : precioTotalCalculado),
          mpPaymentId: pagoVerificado.paymentId,
          esPendiente: !!pagoVerificado.pendiente
        });

        // Limpiar estados y borrador
        sessionStorage.removeItem("emitours_temp_reserva");
        setBorradorPendiente(null);
        setPagoVerificado(null);
        setSelectedTour(null);
        cargarDatos();
      } else {
        setErrorForm(res.data?.mensaje || "Error al procesar reserva");
      }
    } catch (err) {
      console.error(err);
      let msg = err.response?.data?.mensaje || err.message || "Error al realizar reserva";
      setErrorForm(msg);
    } finally {
      setGuardandoReserva(false);
    }
  };

  return (
    <div className="reservas-pagina">
      {/* BANNER HEADER */}
      <div className="reservas-header-banner">
        <h1>{t.reservas_titulo}</h1>
        <p>{t.reservas_desc}</p>
      </div>

      {/* MODAL DE ÉXITO */}
      {mensajeExito && (
        <div className="modal-overlay">
          <div className="modal-reserva exito-card">
            <h2>{t.reserva_exitosa}</h2>
            <div className="codigo-box">
              <span>{t.codigo_reserva}</span>
              <strong>{mensajeExito.codigo}</strong>
            </div>

            <div className="resumen-detalles">
              <p><strong>{t.col_tour}:</strong> {mensajeExito.tourNombre}</p>
              <p><strong>{t.col_fecha_hora}:</strong> {mensajeExito.fecha} - {mensajeExito.hora}</p>
              <p><strong>{t.col_personas}:</strong> {mensajeExito.personas} {language === 'en' ? 'people' : 'personas'}</p>
              <p><strong>{t.col_idioma}:</strong> {mensajeExito.idioma === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}</p>
              <p><strong>{language === 'en' ? 'Total price:' : 'Precio total:'}</strong> ${mensajeExito.total.toLocaleString()} COP</p>
              <p style={{ color: '#0284c7', fontWeight: '700' }}>
                <strong>{mensajeExito.saldoPendiente === 0 ? (language === 'en' ? 'Full payment made (100%):' : 'Pago total realizado (100%):') : (language === 'en' ? 'Initial payment made (50%):' : 'Pago inicial realizado (50%):')}</strong> ${mensajeExito.pagoInicial.toLocaleString()} COP
              </p>
              <p style={{ color: mensajeExito.saldoPendiente > 0 ? '#b45309' : '#059669', fontWeight: '700' }}>
                <strong>{language === 'en' ? 'Remaining balance:' : 'Saldo restante:'}</strong> ${mensajeExito.saldoPendiente.toLocaleString()} COP
              </p>
              <p><strong>{t.col_metodo_pago}:</strong> {mensajeExito.metodo}</p>
              {mensajeExito.mpPaymentId && (
                <p><strong>{language === 'en' ? 'Mercado Pago ID:' : 'ID Transacción MP:'}</strong> <code>#{mensajeExito.mpPaymentId}</code></p>
              )}
              <p className="estado-badge" style={{
                background: mensajeExito.esPendiente ? '#fffbeb' : '#ecfdf5',
                color: mensajeExito.esPendiente ? '#b45309' : '#059669',
                borderColor: mensajeExito.esPendiente ? '#f59e0b' : '#10b981'
              }}>
                {mensajeExito.esPendiente
                  ? (language === 'en' ? '⏳ Pending Bank Acreditation' : '⏳ Pendiente de Acreditación (Bancolombia / Efecty)')
                  : (language === 'en' ? '✓ Confirmed' : '✓ Confirmada')}
              </p>
              {mensajeExito.esPendiente && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginTop: '12px',
                  fontSize: '12.5px',
                  color: '#92400e',
                  lineHeight: '1.45'
                }}>
                  ℹ️ {language === 'en'
                    ? 'Your booking is registered and your spot is reserved. Once your bank transfer or cash deposit is verified by Mercado Pago, your booking will automatically update to Confirmed.'
                    : 'Tu cupo ha sido reservado. Tan pronto como tu entidad bancaria (Bancolombia) o punto físico (Efecty) confirme la acreditación del pago, tu reserva se actualizará automáticamente a Confirmada.'}
                </div>
              )}
            </div>

            <button className="btn-confirmar-modal" onClick={() => setMensajeExito(null)}>
              {language === 'en' ? 'Understood!' : '¡Entendido!'}
            </button>
          </div>
        </div>
      )}

      {/* BANNER DE RECUPERACIÓN SI QUEDÓ UN PAGO PENDIENTE DE VERIFICAR EN MERCADO PAGO */}
      {borradorPendiente && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px auto 25px auto',
          maxWidth: '1200px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>⏳</span>
              <div>
                <strong style={{ color: '#92400e', fontSize: '15px' }}>
                  {language === 'en'
                    ? `Did you complete a payment on Mercado Pago for ${borradorPendiente.tourNombre || 'your tour'}?`
                    : `¿Completaste el pago en Mercado Pago para ${borradorPendiente.tourNombre || 'tu tour'}?`}
                </strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#b45309', lineHeight: '1.4' }}>
                  {language === 'en'
                    ? 'If Mercado Pago displayed "We are processing your payment" (Bancolombia, cash or pending card), enter your transaction ID (#...) to register and confirm your booking right now.'
                    : 'Si Mercado Pago mostró la pantalla naranja "Estamos procesando tu pago" (Bancolombia, transferencia o tarjeta en proceso), ingresa el número de operación o ID de pago para confirmar tu reserva inmediatamente.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("emitours_temp_reserva");
                setBorradorPendiente(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: '1'
              }}
              title={language === 'en' ? 'Dismiss' : 'Descartar'}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={language === 'en' ? 'e.g. 184373816725 (Payment ID)' : 'Ej: 184373816725 (Número de operación / ID Transacción)'}
              value={inputPaymentIdManual}
              onChange={(e) => setInputPaymentIdManual(e.target.value)}
              style={{
                flex: '1',
                minWidth: '240px',
                padding: '9px 12px',
                fontSize: '13.5px',
                borderRadius: '8px',
                border: '1.5px solid #d97706',
                outline: 'none',
                background: '#ffffff'
              }}
            />
            <button
              type="button"
              onClick={() => inputPaymentIdManual && verificarRetornoMercadoPago(inputPaymentIdManual.trim(), 'pending')}
              disabled={verificandoMP || !inputPaymentIdManual.trim()}
              style={{
                padding: '9px 18px',
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: (verificandoMP || !inputPaymentIdManual.trim()) ? 0.6 : 1
              }}
            >
              {verificandoMP ? (language === 'en' ? 'Checking...' : 'Verificando...') : (language === 'en' ? 'Verify & Confirm Booking' : '✓ Verificar y Confirmar Reserva')}
            </button>

            <button
              type="button"
              onClick={handleDetectarUltimoPago}
              disabled={verificandoMP}
              style={{
                padding: '9px 18px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {verificandoMP ? '🔄 Buscando pago...' : '🔄 Detectar automáticamente mi último pago'}
            </button>
          </div>
        </div>
      )}

      {/* TARJETAS DE TOURS / LUGARES PARA RESERVAR */}
      <div className="tours-grid-container">
        {tours.map((tour) => (
          <div key={tour.id} className="tour-card-reserva">
            <div className="tour-card-imagen">
              <img src={tour.imagen || "https://images.unsplash.com/photo-1599818816401-bc8b375b48bd?auto=format&fit=crop&q=80&w=600"} alt={tour.nombre} />
              <span className="cupos-tag">{tour.cupos || 20} {t.cupos_disponibles_tag}</span>
            </div>

            <div className="tour-card-body">
              <h3>{tour.nombre || tour.title}</h3>
              <p className="tour-desc">
                {language === 'en' ? (tour.descripcion_en || tour.descripcion || tour.desc) : (tour.descripcion || tour.desc)}
              </p>

              <div className="tour-meta-row">
                <span>⏱️ {language === 'en' ? (tour.duracion_en || tour.duracion) : tour.duracion}</span>
                <span className="tour-precio">${(tour.precio || 0).toLocaleString()} COP</span>
              </div>

              <p className="tour-detalles">
                {language === 'en' 
                  ? 'Full tour with expert guide and assistance insurance' 
                  : (tour.servicios || 'Tour completo con guía experto y seguro de asistencia')}
              </p>

              <button
                className="btn-reservar-tour"
                onClick={() => abrirFormularioReserva(tour)}
              >
                {t.reservar_ahora}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE FORMULARIO DE RESERVA */}
      {selectedTour && (
        <div className="modal-overlay">
          <div className="modal-reserva">
            <div className="modal-header">
              <h2>{t.modal_reservar_titulo}: {selectedTour.nombre || selectedTour.title}</h2>
              <button className="btn-close" onClick={() => setSelectedTour(null)}>✕</button>
            </div>

            {/* INFORMACIÓN ESPECÍFICA DEL TOUR SELECCIONADO EN RESERVAS */}
            <div className="modal-tour-info-box" style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.45' }}>
                {language === 'en' ? (selectedTour.descripcion_en || selectedTour.descripcion) : selectedTour.descripcion}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>
                <span>⏱️ <strong>{t.duracion}:</strong> {language === 'en' ? (selectedTour.duracion_en || selectedTour.duracion) : selectedTour.duracion}</span>
                <span style={{ color: '#0284c7' }}>💰 <strong>{t.precio}:</strong> ${(selectedTour.precio || 0).toLocaleString()} COP / {language === 'en' ? 'person' : 'persona'}</span>
              </div>
            </div>

            {errorForm && (
              <div className="alerta-error-form">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleSubmitReserva} className="form-reserva-redisenado">
              <label>{t.nombre_completo} *</label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej: Ximena López"
                required
              />

              <label>{t.celular} *</label>
              <input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="Ej: 3001234567"
                required
              />

              <div className="form-row">
                <div>
                  <label>{t.cantidad_personas} *</label>
                  <input
                    type="number"
                    min="1"
                    value={numeroPersonas}
                    onChange={(e) => setNumeroPersonas(e.target.value)}
                    required
                  />
                  <small className="help-text">{language === 'en' ? 'No limit per booking' : 'Sin límite de personas por reserva'}</small>
                </div>

                <div>
                  <label>{t.fecha_tour} *</label>
                  <input
                    type="date"
                    value={fechaTour}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setFechaTour(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label>{language === 'en' ? 'Select time' : 'Selecciona la hora'} *</label>
                  <select
                    value={horaTour}
                    onChange={(e) => setHoraTour(e.target.value)}
                    required
                    className="select-hora-sencillo"
                  >
                    {HORARIOS_DISPONIBLES.map((horario, index) => (
                      <option key={index} value={horario}>{horario}</option>
                    ))}
                  </select>
                  <small className="help-text">07:00 AM - 07:00 PM</small>
                </div>

                <div>
                  <label>{t.idioma_tour_label} *</label>
                  <select
                    value={idiomaTour}
                    onChange={(e) => setIdiomaTour(e.target.value)}
                    required
                  >
                    <option value="es">🇪🇸 {t.opcion_espanol}</option>
                    <option value="en">🇬🇧 {t.opcion_ingles}</option>
                  </select>
                </div>
              </div>

              {/* OPCIONES DE PAGO: PAGAR EL TOTAL (100%) O PAGAR EL 50% */}
              <label style={{ fontWeight: '700', color: '#0f172a', marginTop: '10px', display: 'block' }}>
                {language === 'en' ? 'Payment Option *' : 'Opción de Pago *'}
              </label>
              <div className="booking-payment-options-grid">
                <button
                  type="button"
                  onClick={() => setTipoPago("total")}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: tipoPago === 'total' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: tipoPago === 'total' ? '#f0f9ff' : '#ffffff',
                    color: tipoPago === 'total' ? '#0369a1' : '#475569',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>💳 {language === 'en' ? 'Pay in full' : 'Pagar el total'}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: '500', color: '#059669' }}>
                    {language === 'en' ? '(100% of reservation)' : '(100% de la reserva)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoPago("50")}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: tipoPago === '50' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: tipoPago === '50' ? '#f0f9ff' : '#ffffff',
                    color: tipoPago === '50' ? '#0369a1' : '#475569',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>🪙 {language === 'en' ? 'Pay 50%' : 'Pagar el 50%'}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: '500', color: '#b45309' }}>
                    {language === 'en' ? '(Initial deposit)' : '(Abono inicial)'}
                  </span>
                </button>
              </div>

              {/* DESGLOSE AUTOMÁTICO DE PAGO */}
              {(() => {
                const precioUnit = typeof selectedTour.precio === 'number' ? selectedTour.precio : 100000;
                const totalCalc = precioUnit * (parseInt(numeroPersonas, 10) || 1);
                const esPagoTotal = (tipoPago === 'total');
                const pagoInicialCalc = esPagoTotal ? totalCalc : Math.round(totalCalc * 0.5);
                const saldoPendienteCalc = esPagoTotal ? 0 : (totalCalc - pagoInicialCalc);
                return (
                  <div className="desglose-pago-box" style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    margin: '12px 0 16px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                      <span>{language === 'en' ? 'Total price:' : 'Precio total:'}</span>
                      <strong style={{ color: '#0f172a' }}>${totalCalc.toLocaleString()} COP</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#0284c7', fontWeight: '700', padding: '6px 0', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1' }}>
                      <span>{esPagoTotal ? (t.pago_total_label || 'Total a abonar (100%):') : (t.pago_inicial_label || 'Pago inicial a realizar (50%):')}</span>
                      <span>${pagoInicialCalc.toLocaleString()} COP</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: esPagoTotal ? '#059669' : '#b45309' }}>
                      <span>{t.saldo_pendiente_label || 'Saldo pendiente:'}</span>
                      <strong>${saldoPendienteCalc.toLocaleString()} COP</strong>
                    </div>
                    <small style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                      {esPagoTotal 
                        ? (t.aviso_pago_total || '✓ Tu reserva quedará pagada en su totalidad sin saldo pendiente.') 
                        : (t.aviso_pago_50 || 'ℹ️ El saldo pendiente (50%) se cancela antes de iniciar el tour.')}
                    </small>
                  </div>
                );
              })()}

              <label>{t.metodo_pago} *</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} required>
                {METODOS_PAGO_PERMITIDOS.map((mp, index) => (
                  <option key={index} value={mp}>
                    {mp}
                  </option>
                ))}
              </select>

              {/* SECCIÓN INTERACTIVA DE MERCADO PAGO CHECKOUT PRO */}
              <div className="mp-checkout-section">
                {verificandoMP && (
                  <div className="card-estado-mp pendiente">
                    <div className="card-estado-mp-header">
                      <span>⏳ Verificando transacción con Mercado Pago...</span>
                    </div>
                  </div>
                )}

                {pagoVerificado && pagoVerificado.aprobado && (
                  <div className="card-estado-mp aprobado">
                    <div className="card-estado-mp-header">
                      <span>✅ Pago Aprobado por Mercado Pago (Sandbox)</span>
                    </div>
                    <div className="card-estado-mp-detalles">
                      <span><strong>ID Transacción:</strong> #{pagoVerificado.paymentId}</span>
                      <span><strong>Monto Pagado:</strong> ${(pagoVerificado.monto || 0).toLocaleString()} COP</span>
                      <span><strong>Medio:</strong> {pagoVerificado.metodo_pago ? pagoVerificado.metodo_pago.toUpperCase() : metodoPago}</span>
                      {pagoVerificado.ya_utilizado ? (
                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                          ⚠️ Atención: Esta transacción ya fue asociada a la reserva {pagoVerificado.reserva?.codigo || ''}.
                        </span>
                      ) : (
                        <div style={{
                          marginTop: '6px',
                          padding: '8px 12px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '6px',
                          color: '#065f46',
                          fontSize: '12.5px',
                          fontWeight: '600'
                        }}>
                          👉 {language === 'en'
                            ? 'Payment approved! Please click "Confirm Booking" below to save your booking.'
                            : '¡Pago verificado! Pulsa el botón "Confirmar reserva" abajo para guardar tu reserva en el sistema.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {pagoVerificado && pagoVerificado.pendiente && (
                  <div className="card-estado-mp pendiente">
                    <div className="card-estado-mp-header">
                      <span>⏳ Pago en proceso / Pendiente</span>
                    </div>
                    <div className="card-estado-mp-detalles">
                      <span><strong>ID Transacción:</strong> #{pagoVerificado.paymentId}</span>
                      <span><strong>Medio:</strong> {pagoVerificado.metodo_pago ? pagoVerificado.metodo_pago.toUpperCase() : 'Bancolombia / Efecty / Transferencia'}</span>
                      <span>El pago está siendo procesado por la entidad bancaria o pendiente de consignación.</span>
                      {pagoVerificado.ya_utilizado ? (
                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                          ⚠️ Atención: Esta transacción ya fue asociada a la reserva {pagoVerificado.reserva?.codigo || ''}.
                        </span>
                      ) : (
                        <div style={{
                          marginTop: '6px',
                          padding: '8px 12px',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '6px',
                          color: '#92400e',
                          fontSize: '12.5px',
                          fontWeight: '600'
                        }}>
                          👉 {language === 'en'
                            ? 'Payment in process. Click "Confirm Booking" below to secure your spot as pending.'
                            : 'Pago en proceso. Pulsa el botón "Confirmar reserva" abajo para registrar tu cupo en estado pendiente.'}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-reintentar-mp"
                      onClick={() => verificarRetornoMercadoPago(pagoVerificado.paymentId, 'pending')}
                      style={{ marginTop: '8px' }}
                    >
                      🔄 Re-verificar estado
                    </button>
                  </div>
                )}

                {pagoVerificado && pagoVerificado.rechazado && (
                  <div className="card-estado-mp rechazado">
                    <div className="card-estado-mp-header">
                      <span>❌ Pago Rechazado / No Aprobado</span>
                    </div>
                    <div className="card-estado-mp-detalles">
                      <span><strong>ID Transacción:</strong> #{pagoVerificado.paymentId}</span>
                      <span>La transacción no fue autorizada o fue cancelada. Puedes reintentar con otro medio.</span>
                    </div>
                    <button
                      type="button"
                      className="btn-reintentar-mp"
                      onClick={handleIniciarPagoMercadoPago}
                      disabled={cargandoMP}
                    >
                      🔄 Reintentar pago con Mercado Pago
                    </button>
                  </div>
                )}

                {/* BOTÓN PARA INICIAR EL PAGO SI AÚN NO ESTÁ APROBADO */}
                {(!pagoVerificado || (!pagoVerificado.aprobado && !pagoVerificado.pendiente && !pagoVerificado.rechazado)) && (
                  <>
                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '10px',
                      fontSize: '12.5px',
                      color: '#1e40af',
                      lineHeight: '1.45'
                    }}>
                      <strong>💡 Datos oficiales de prueba Sandbox (Colombia):</strong>
                      <div style={{ marginTop: '4px' }}>
                        • <strong>Tarjeta:</strong> <code>5254 1336 7440 3564</code> (Mastercard) o <code>4013 5406 8274 6260</code> (Visa)<br />
                        • <strong>Titular:</strong> <strong>APRO</strong> | <strong>Vencimiento:</strong> <strong>11/30</strong> | <strong>CVV:</strong> <strong>123</strong><br />
                        • <strong>Documento:</strong> <strong>123456789</strong> (o cualquier CC válida de 8-10 dígitos)<br />
                        • <em>Recomendación:</em> Abre en <strong>ventana de incógnito</strong> si tienes iniciada tu cuenta personal de Mercado Pago.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-pagar-mp"
                      onClick={handleIniciarPagoMercadoPago}
                      disabled={cargandoMP}
                    >
                      {cargandoMP ? (
                        <span>⏳ Abriendo Checkout Pro...</span>
                      ) : (
                        <>
                          <span>💳 Pagar con Mercado Pago Sandbox</span>
                          <span style={{ fontSize: '12.5px', opacity: 0.9 }}>
                            ({tipoPago === 'total' ? '100%' : '50%'})
                          </span>
                        </>
                      )}
                    </button>

                    {/* SECCIÓN OPCIONAL: VERIFICACIÓN MANUAL DE ID DE PAGO (ÚTIL EN ENTORNO LOCALHOST) */}
                    <div style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                        ¿Completaste el pago en Mercado Pago? Verifica tu transacción aquí:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Ej: 12345678901 (Número de operación / Payment ID)"
                          value={inputPaymentIdManual}
                          onChange={(e) => setInputPaymentIdManual(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            fontSize: '12.5px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => inputPaymentIdManual && verificarRetornoMercadoPago(inputPaymentIdManual.trim(), 'approved')}
                          disabled={verificandoMP || !inputPaymentIdManual.trim()}
                          style={{
                            padding: '8px 14px',
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {verificandoMP ? 'Verificando...' : 'Verificar ID'}
                        </button>

                        <button
                          type="button"
                          onClick={handleDetectarUltimoPago}
                          disabled={verificandoMP}
                          style={{
                            padding: '8px 14px',
                            background: '#0369a1',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {verificandoMP ? 'Buscando...' : '🔄 Detectar último pago'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* BOTÓN FINAL DE CONFIRMAR RESERVA (HABILITADO TRAS PAGO APROBADO O EN PROCESO) */}
              <button
                type="submit"
                className="btn-confirmar-modal"
                disabled={guardandoReserva || !pagoVerificado || (!pagoVerificado.aprobado && !pagoVerificado.pendiente) || pagoVerificado.ya_utilizado}
                style={{
                  marginTop: '12px',
                  backgroundColor: pagoVerificado?.pendiente ? '#d97706' : (pagoVerificado?.aprobado ? '#059669' : undefined),
                  opacity: (guardandoReserva || !pagoVerificado || (!pagoVerificado.aprobado && !pagoVerificado.pendiente) || pagoVerificado.ya_utilizado) ? 0.6 : 1,
                  cursor: (guardandoReserva || !pagoVerificado || (!pagoVerificado.aprobado && !pagoVerificado.pendiente) || pagoVerificado.ya_utilizado) ? 'not-allowed' : 'pointer'
                }}
              >
                {guardandoReserva
                  ? (language === 'en' ? '⏳ Confirming booking...' : '⏳ Guardando reserva...')
                  : pagoVerificado && pagoVerificado.aprobado && !pagoVerificado.ya_utilizado
                    ? `✓ ${t.confirmar_reserva} (${language === 'en' ? 'Payment Approved' : 'Pago Verificado'})`
                    : pagoVerificado && pagoVerificado.pendiente && !pagoVerificado.ya_utilizado
                      ? `⏳ ${t.confirmar_reserva} (${language === 'en' ? 'Payment in Process' : 'Pago en Proceso / Pendiente'})`
                      : `🔒 ${t.confirmar_reserva} (${language === 'en' ? 'Requires Payment' : 'Requiere Pago Previo'})`}
              </button>

              {(!pagoVerificado || (!pagoVerificado.aprobado && !pagoVerificado.pendiente)) && (
                <small className="aviso-pago-bloqueado">
                  ℹ️ {language === 'en' 
                    ? 'First complete or initiate your payment in Mercado Pago to enable booking confirmation.'
                    : 'Primero inicia o completa el pago en Mercado Pago para habilitar la confirmación.'}
                </small>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TABLA HISTORIAL DE RESERVAS REGISTRADAS */}
      {user && misReservas.length > 0 && (
        <div className="mis-reservas-seccion">
          <h2>{t.mis_reservas}</h2>
          <div className="tabla-historial-wrapper">
            <table className="tabla-historial">
              <thead>
                <tr>
                  <th>{t.col_codigo}</th>
                  <th>{t.col_tour}</th>
                  <th>{t.col_fecha_hora}</th>
                  <th>{t.col_personas}</th>
                  <th>{t.col_idioma}</th>
                  <th>{t.col_metodo_pago}</th>
                  <th>{language === 'en' ? 'Amount Paid' : 'Pago Realizado'}</th>
                  <th>{language === 'en' ? 'Remaining Balance' : 'Saldo Pendiente'}</th>
                  <th>{t.col_total}</th>
                  <th>{t.col_estado}</th>
                  <th>{t.col_estado_pago}</th>
                </tr>
              </thead>
              <tbody>
                {misReservas.map((r) => {
                  const esPagado = (r.estado_pago || '').toLowerCase().includes('pagad');
                  const tot = Number(r.precio_total || 0);
                  const abono = (r.monto_pagado !== undefined && Number(r.monto_pagado) > 0)
                    ? Number(r.monto_pagado)
                    : (esPagado ? tot : Math.round(tot * 0.5));
                  const pendiente = Math.max(0, tot - abono);

                  const getEstadoReservaLabel = (st) => {
                    const s = (st || '').toLowerCase();
                    if (s.includes('confir')) return t.estado_reserva_confirmada || 'Confirmada';
                    if (s.includes('realiz')) return t.estado_reserva_realizada || 'Realizada';
                    if (s.includes('cancel')) return t.estado_reserva_cancelada || 'Cancelada';
                    return t.estado_reserva_pendiente || 'Pendiente';
                  };

                  const getEstadoPagoLabel = (esPag, st) => {
                    if (esPag) return t.estado_pago_pagado || 'Pagado (100%)';
                    if ((st || '').toLowerCase().includes('parcial')) return t.estado_pago_parcial || 'Parcial (50%)';
                    return t.estado_pago_pendiente || 'Pendiente';
                  };

                  return (
                    <tr key={r.id}>
                      <td><code className="codigo-tag">{r.codigo || `RES-${r.id}`}</code></td>
                      <td><strong>{r.lugar_nombre || 'Tour EmiTours'}</strong></td>
                      <td>{r.fecha ? r.fecha.toString().substring(0, 10) : 'Pendiente'} - {r.hora}</td>
                      <td>{r.numero_personas} {language === 'en' ? 'guests' : 'pers'}</td>
                      <td>{r.idioma === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}</td>
                      <td>{r.metodo_pago === 'Pago en efectivo' && language === 'en' ? 'Cash' : (r.metodo_pago === 'Datáfono' && language === 'en' ? 'Card Terminal' : (r.metodo_pago || 'Nequi'))}</td>
                      <td><strong style={{ color: '#0284c7' }}>${abono.toLocaleString()} COP</strong></td>
                      <td><strong style={{ color: esPagado ? '#059669' : '#b45309' }}>${pendiente.toLocaleString()} COP</strong></td>
                      <td>${tot.toLocaleString()} COP</td>
                      <td>
                        <span className={`estado-pill ${r.estado ? r.estado.toLowerCase() : 'pendiente'}`}>
                          {getEstadoReservaLabel(r.estado)}
                        </span>
                      </td>
                      <td>
                        <span className={`estado-pill ${esPagado ? 'confirmada' : (r.estado_pago === 'parcial' ? 'pendiente' : 'pendiente')}`}>
                          {getEstadoPagoLabel(esPagado, r.estado_pago)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;
