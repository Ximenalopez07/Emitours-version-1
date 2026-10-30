import React, { useState, useEffect, useContext } from "react";
import { UIContext } from "../context/UIContext";
import { getLugares, getReservas, createReserva, crearPreferenciaMP, verificarPagoMP, cancelarReserva } from "../api";
import { validarConflictoReserva } from "../utils/validacionesReserva";
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
  const [metodoPago, setMetodoPago] = useState("Mercado Pago");
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorForm, setErrorForm] = useState(null);

  // ESTADOS MERCADO PAGO CHECKOUT PRO AUTOMATIZADO
  const [cargandoMP, setCargandoMP] = useState(false);
  const [procesandoRetornoMP, setProcesandoRetornoMP] = useState(false);
  const [alertaRetorno, setAlertaRetorno] = useState(null);

  // ESTADOS PARA CANCELACIÓN DE RESERVA POR EL USUARIO
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelandoReserva, setCancelandoReserva] = useState(false);
  const [alertaCancelacion, setAlertaCancelacion] = useState(null);

  // ESTADO PARA ADVERTENCIA DE CONFLICTO DE HORARIO O REGLA DE GUATAPÉ
  const [alertaConflicto, setAlertaConflicto] = useState(null);

  // Función para confirmar la cancelación tras la advertencia del usuario
  const handleConfirmarCancelacion = async () => {
    if (!reservaACancelar) return;
    setCancelandoReserva(true);
    setAlertaCancelacion(null);
    try {
      const res = await cancelarReserva(reservaACancelar.id);
      if (res.data && res.data.status === "OK") {
        // Actualización reactiva inmediata en la tabla
        setMisReservas(prev => prev.map(r => r.id === reservaACancelar.id ? { ...r, estado: 'cancelada' } : r));
        setAlertaCancelacion({
          tipo: 'success',
          mensaje: language === 'en'
            ? `Booking #${reservaACancelar.codigo || reservaACancelar.id} cancelled successfully. The administrator has been notified.`
            : `Reserva #${reservaACancelar.codigo || reservaACancelar.id} cancelada exitosamente. El administrador ha sido notificado.`
        });
        setReservaACancelar(null);
        cargarDatos();
      } else {
        setAlertaCancelacion({
          tipo: 'error',
          mensaje: res.data?.mensaje || (language === 'en' ? 'Could not cancel booking.' : 'No se pudo cancelar la reserva.')
        });
      }
    } catch (err) {
      console.error("Error al cancelar reserva:", err);
      setAlertaCancelacion({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || (language === 'en' ? 'Error processing booking cancellation.' : 'Error al procesar la cancelación de la reserva.')
      });
    } finally {
      setCancelandoReserva(false);
    }
  };

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
      // Limpiar parámetros de la URL inmediatamente para evitar reprocesar si el usuario recarga
      window.history.replaceState({}, document.title, window.location.pathname);
      procesarRetornoAutomaticoMP(paymentIdUrl, statusUrl);
    }
  }, [user]);

  const procesarRetornoAutomaticoMP = async (pId, stUrl) => {
    setProcesandoRetornoMP(true);
    setAlertaRetorno(null);
    setErrorForm(null);

    try {
      // 1. Obtener borrador de reserva de sessionStorage
      const tempJson = sessionStorage.getItem("emitours_temp_reserva");
      let borrador = null;
      if (tempJson) {
        try {
          borrador = JSON.parse(tempJson);
        } catch (e) {
          console.warn("No se pudo parsear emitours_temp_reserva", e);
        }
      }

      // 2. Consultar directamente al backend para verificar el estado real con Mercado Pago SDK
      const res = await verificarPagoMP(pId);
      if (!res.data || res.data.status !== "OK") {
        setAlertaRetorno({
          tipo: 'error',
          mensaje: language === 'en'
            ? `Could not verify payment with Mercado Pago: ${res.data?.mensaje || 'Unknown error'}`
            : `No se pudo verificar la transacción con Mercado Pago: ${res.data?.mensaje || 'Error desconocido'}`
        });
        return;
      }

      const info = res.data;

      // Caso 1: La transacción ya fue utilizada en una reserva registrada previamente (idempotencia)
      if (info.ya_utilizado && info.reserva) {
        await cargarDatos();
        const resv = info.reserva;
        setMensajeExito({
          codigo: resv.codigo || 'RES-CONFIRMADA',
          tourNombre: borrador?.tourNombre || 'Tour EmiTours',
          fecha: resv.fecha || borrador?.fechaTour || '',
          hora: borrador?.horaTour || '07:00 AM',
          personas: borrador?.numeroPersonas || 1,
          idioma: borrador?.idiomaTour || 'es',
          metodo: 'Mercado Pago',
          total: resv.precio_total || 0,
          pagoInicial: resv.monto_pagado || 0,
          saldoPendiente: Math.max(0, (resv.precio_total || 0) - (resv.monto_pagado || 0)),
          mpPaymentId: pId,
          esPendiente: resv.estado === 'pendiente'
        });
        sessionStorage.removeItem("emitours_temp_reserva");
        return;
      }

      // Caso 2: El pago fue rechazado o cancelado en Mercado Pago
      if (info.rechazado || info.estado_mp === 'rejected' || info.estado_mp === 'cancelled') {
        setAlertaRetorno({
          tipo: 'error',
          mensaje: language === 'en'
            ? `The payment was rejected by Mercado Pago (${info.status_detail || 'not authorized'}). The booking was not created. You can retry with another payment method.`
            : `El pago fue rechazado por Mercado Pago (${info.status_detail || 'no autorizado'}). La reserva no fue creada. Puedes intentar nuevamente.`
        });
        sessionStorage.removeItem("emitours_temp_reserva");
        return;
      }

      // Caso 3: Pago Aprobado o Pendiente de Acreditación (Bancolombia, Efecty, PSE)
      const meta = info.metadata || {};
      const currentUsr = user || (localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")) : null);
      const uId = borrador?.usuarioId || meta.usuario_id || currentUsr?.id_registro || currentUsr?.id;
      const lId = borrador?.tourId || meta.lugar_id;
      const cantPersonas = parseInt(borrador?.numeroPersonas || meta.numero_personas || 1, 10);
      const esPagoTotal = (borrador?.tipoPago === 'total' || meta.tipo_pago === 'total');
      const precioUnit = borrador?.precioUnitario || (meta.precio_total ? meta.precio_total / cantPersonas : 100000);
      const totalCalc = borrador?.precioTotal || meta.precio_total || (precioUnit * cantPersonas);
      const pagoInicialCalc = esPagoTotal ? totalCalc : Math.round(totalCalc * 0.5);
      const saldoPendienteCalc = esPagoTotal ? 0 : (totalCalc - pagoInicialCalc);

      const payload = {
        usuario_id: uId,
        nombre_completo: borrador?.nombreCompleto || meta.nombre_completo || currentUsr?.nombre_usuario || 'Cliente EmiTours',
        celular: borrador?.celular || meta.celular || currentUsr?.telefono || '',
        lugar_id: lId,
        numero_personas: cantPersonas,
        fecha: borrador?.fechaTour || meta.fecha,
        hora: borrador?.horaTour || meta.hora || '07:00 AM',
        idioma: borrador?.idiomaTour || meta.idioma || 'es',
        metodo_pago: `Mercado Pago (${info.metodo_pago ? info.metodo_pago.toUpperCase() : 'Checkout Pro'})`,
        opcion_pago: esPagoTotal ? 'Pagar el total' : 'Pagar el 50%',
        precio_total: totalCalc,
        mp_payment_id: pId,
        monto_abonado: info.aprobado ? (info.monto || pagoInicialCalc) : 0
      };

      const resCrear = await createReserva(payload);
      if (resCrear.data && (resCrear.data.status === 'OK' || resCrear.data.status === 'CREADA' || resCrear.data.ya_existia)) {
        const dataRes = resCrear.data;
        const codigoGen = dataRes.codigo || `RES-${Math.floor(100000 + Math.random() * 900000)}`;

        const tourObj = tours.find(t => String(t.id) === String(lId));
        const nombreTourVoucher = tourObj?.nombre || borrador?.tourNombre || meta.tour_nombre || 'Tour EmiTours';

        setMensajeExito({
          codigo: codigoGen,
          tourNombre: nombreTourVoucher,
          fecha: payload.fecha,
          hora: payload.hora,
          personas: cantPersonas,
          idioma: payload.idioma,
          metodo: payload.metodo_pago,
          total: totalCalc,
          pagoInicial: dataRes.monto_pagado !== undefined ? dataRes.monto_pagado : (info.aprobado ? (info.monto || pagoInicialCalc) : 0),
          saldoPendiente: dataRes.saldo_pendiente !== undefined ? dataRes.saldo_pendiente : (info.aprobado ? saldoPendienteCalc : totalCalc),
          mpPaymentId: pId,
          esPendiente: !!info.pendiente
        });

        sessionStorage.removeItem("emitours_temp_reserva");
        await cargarDatos();
      } else {
        setAlertaRetorno({
          tipo: 'error',
          mensaje: resCrear.data?.mensaje || 'Error al guardar la reserva en el sistema.'
        });
      }
    } catch (err) {
      console.error("Error al procesar retorno automático de Mercado Pago:", err);
      const msg = err.response?.data?.mensaje || err.message || 'Error al procesar la confirmación';
      setAlertaRetorno({
        tipo: 'error',
        mensaje: language === 'en'
          ? `Error confirming booking: ${msg}`
          : `Error al confirmar tu reserva: ${msg}`
      });
    } finally {
      setProcesandoRetornoMP(false);
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
    setMetodoPago("Mercado Pago");
    setMensajeExito(null);
    setErrorForm(null);
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

    // VALIDACIÓN PREVENTIVA DE CONFLICTO DE HORARIOS Y REGLA DE GUATAPÉ EN FRONTEND
    const validacion = validarConflictoReserva({
      lugarId: selectedTour.id,
      lugarNombre: selectedTour.nombre || selectedTour.title,
      fecha: fechaTour,
      hora: horaTour || "07:00 AM",
      reservasExistentes: misReservas
    });

    if (validacion.hayConflicto) {
      setAlertaConflicto(validacion);
      return;
    }

    setCargandoMP(true);

    try {
      const precioUnitario = typeof selectedTour.precio === 'number' ? selectedTour.precio : 100000;
      const totalCalculado = precioUnitario * cantidadPersonas;

      // Guardar el borrador en sessionStorage para confirmar automáticamente al retornar de Mercado Pago
      const borrador = {
        usuarioId,
        tourId: selectedTour.id,
        tourNombre: selectedTour.nombre || selectedTour.title,
        precioUnitario,
        precioTotal: totalCalculado,
        nombreCompleto,
        celular,
        numeroPersonas: cantidadPersonas,
        fechaTour,
        horaTour: horaTour || "07:00 AM",
        idiomaTour: idiomaTour || "es",
        tipoPago,
        metodoPago: "Mercado Pago"
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
        metodo_pago: "Mercado Pago"
      });

      if (res.data && res.data.status === 'OK') {
        const urlCheckout = res.data.checkoutUrl || res.data.sandboxInitPoint || res.data.initPoint;
        if (urlCheckout) {
          // Redirigir al Checkout Pro oficial de Mercado Pago
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
      // Si el servidor detectó conflicto de reservas
      if (err.response?.status === 409 && err.response?.data?.status === 'CONFLICTO_RESERVA') {
        setAlertaConflicto({
          hayConflicto: true,
          titulo: err.response.data.titulo,
          mensaje: err.response.data.mensaje,
          detalles: err.response.data.detalles
        });
        setCargandoMP(false);
        return;
      }

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

      {/* MODAL DE CARGA AL RETORNAR DE MERCADO PAGO */}
      {procesandoRetornoMP && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-reserva" style={{ textAlign: 'center', padding: '35px 25px', maxWidth: '450px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #e0f2fe',
              borderTop: '4px solid #0284c7',
              borderRadius: '50%',
              margin: '0 auto 20px auto',
              animation: 'spin 1s linear infinite'
            }} />
            <h3 style={{ color: '#0369a1', margin: '0 0 10px 0', fontSize: '18px' }}>
              {language === 'en' ? 'Verifying payment with Mercado Pago...' : 'Verificando pago con Mercado Pago...'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0, lineHeight: '1.5' }}>
              {language === 'en'
                ? 'Please wait a moment while we automatically register and confirm your booking.'
                : 'Por favor espera un momento mientras registramos y confirmamos tu reserva automáticamente.'}
            </p>
          </div>
        </div>
      )}

      {/* ALERTA DE RETORNO (ERROR O RECHAZO) */}
      {alertaRetorno && (
        <div style={{
          background: alertaRetorno.tipo === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1.5px solid ${alertaRetorno.tipo === 'error' ? '#ef4444' : '#10b981'}`,
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px auto 25px auto',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{alertaRetorno.tipo === 'error' ? '❌' : '✅'}</span>
            <span style={{ color: alertaRetorno.tipo === 'error' ? '#991b1b' : '#065f46', fontSize: '14px', fontWeight: '500' }}>
              {alertaRetorno.mensaje}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAlertaRetorno(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#9ca3af',
              lineHeight: '1'
            }}
            title={language === 'en' ? 'Close' : 'Cerrar'}
          >
            ✕
          </button>
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

            <form onSubmit={(e) => { e.preventDefault(); handleIniciarPagoMercadoPago(); }} className="form-reserva-redisenado">
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

              {/* AVISO PREVENTIVO INLINE SI HAY CONFLICTO CON LA FECHA / HORA SELECCIONADAS */}
              {(() => {
                if (!fechaTour || !selectedTour) return null;
                const checkInline = validarConflictoReserva({
                  lugarId: selectedTour.id,
                  lugarNombre: selectedTour.nombre || selectedTour.title,
                  fecha: fechaTour,
                  hora: horaTour || "07:00 AM",
                  reservasExistentes: misReservas
                });
                if (!checkInline.hayConflicto) return null;
                return (
                  <div className="alerta-conflicto-inline">
                    <div className="alerta-conflicto-inline-header">
                      <span>⚠️</span>
                      <strong>{checkInline.titulo}</strong>
                    </div>
                    <p>{checkInline.mensaje}</p>
                    {checkInline.detalles && (
                      <div className="alerta-conflicto-inline-detalles">
                        <span>🗓️ <strong>{checkInline.detalles.tour_existente}</strong> ({checkInline.detalles.fecha})</span>
                        <span>⏰ {checkInline.detalles.hora_inicio} a {checkInline.detalles.hora_fin}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

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

              {errorForm && (
                <div className="alerta-error-form" style={{ marginTop: '12px' }}>
                  {errorForm}
                </div>
              )}

              {/* BOTÓN ÚNICO Y VISIBLE: PAGAR CON MERCADO PAGO */}
              <button
                type="submit"
                className="btn-pagar-mp"
                disabled={cargandoMP}
                style={{ marginTop: '18px' }}
              >
                {cargandoMP ? (
                  <span>⏳ {language === 'en' ? 'Redirecting to Mercado Pago...' : 'Redirigiendo a Mercado Pago...'}</span>
                ) : (
                  <>
                    <span>💳 {language === 'en' ? 'Pay with Mercado Pago' : 'Pagar con Mercado Pago'}</span>
                    <span style={{ fontSize: '13px', opacity: 0.9 }}>
                      ({tipoPago === 'total' ? (language === 'en' ? '100% Total' : '100% Total') : (language === 'en' ? '50% Deposit' : '50% Abono')})
                    </span>
                  </>
                )}
              </button>
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
                  <th style={{ textAlign: 'center' }}>{language === 'en' ? 'Actions' : 'Acciones'}</th>
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
                      <td style={{ textAlign: 'center' }}>
                        {(!r.estado || (!r.estado.toLowerCase().includes('cancel') && !r.estado.toLowerCase().includes('realiz'))) ? (
                          <button
                            type="button"
                            className="btn-cancelar-reserva-tabla"
                            onClick={() => setReservaACancelar(r)}
                            title={language === 'en' ? 'Cancel this booking' : 'Cancelar esta reserva'}
                          >
                            {language === 'en' ? 'Cancel booking' : 'Cancelar reserva'}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12.5px', fontWeight: '600' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* MODAL ADVERTENCIA Y CONFIRMACIÓN DE CANCELACIÓN DE RESERVA */}
      {reservaACancelar && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-reserva" style={{ maxWidth: '520px', padding: '30px 24px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              margin: '0 auto 16px auto'
            }}>
              ⚠️
            </div>

            <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '800', margin: '0 0 12px 0' }}>
              {language === 'en'
                ? 'Are you sure you want to cancel this booking?'
                : '¿Estás seguro de que deseas cancelar esta reserva?'}
            </h3>

            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 18px 0', textAlign: 'justify' }}>
              {language === 'en'
                ? 'Please note that once the booking is cancelled, no refund of the money paid will be made. If you continue, the booking will be marked as cancelled and the administrator will be able to review its status.'
                : 'Ten en cuenta que, una vez cancelada la reserva, no se realizará ninguna devolución del dinero pagado. Si continúas, la reserva quedará marcada como cancelada y el administrador podrá consultar su estado.'}
            </p>

            {/* Resumen de la reserva */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '22px',
              fontSize: '13px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Booking Code:' : 'Código:'}</span>
                <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{reservaACancelar.codigo || `RES-${reservaACancelar.id}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Tour:' : 'Tour:'}</span>
                <strong>{reservaACancelar.lugar_nombre || 'Tour EmiTours'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Date & Time:' : 'Fecha y hora:'}</span>
                <span>{reservaACancelar.fecha ? String(reservaACancelar.fecha).substring(0, 10) : ''} - {reservaACancelar.hora}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn-modal-cancelar-volver"
                onClick={() => setReservaACancelar(null)}
                disabled={cancelandoReserva}
              >
                {language === 'en' ? 'Back' : 'Volver'}
              </button>
              <button
                type="button"
                className="btn-modal-cancelar-confirmar"
                onClick={handleConfirmarCancelacion}
                disabled={cancelandoReserva}
              >
                {cancelandoReserva
                  ? (language === 'en' ? 'Cancelling...' : 'Cancelando...')
                  : (language === 'en' ? 'Yes, cancel booking' : 'Sí, cancelar reserva')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTA DE CANCELACIÓN */}
      {alertaCancelacion && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: alertaCancelacion.tipo === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1.5px solid ${alertaCancelacion.tipo === 'success' ? '#10b981' : '#ef4444'}`,
          borderRadius: '12px',
          padding: '14px 20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '420px'
        }}>
          <span style={{ fontSize: '20px' }}>{alertaCancelacion.tipo === 'success' ? '✅' : '❌'}</span>
          <span style={{ fontSize: '13.5px', color: alertaCancelacion.tipo === 'success' ? '#065f46' : '#991b1b', fontWeight: '600' }}>
            {alertaCancelacion.mensaje}
          </span>
          <button
            type="button"
            onClick={() => setAlertaCancelacion(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', marginLeft: 'auto' }}
          >
            ✕
          </button>
        </div>
      )}
      {/* MODAL ADVERTENCIA Y CONFIRMACIÓN DE CONFLICTO DE HORARIO O REGLA DE GUATAPÉ */}
      {alertaConflicto && alertaConflicto.hayConflicto && (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
          <div className="modal-reserva modal-alerta-conflicto">
            <div className="icono-alerta-conflicto">
              ⚠️
            </div>

            <h3 className="titulo-alerta-conflicto">
              {alertaConflicto.titulo}
            </h3>

            <p className="mensaje-alerta-conflicto">
              {alertaConflicto.mensaje}
            </p>

            {alertaConflicto.detalles && (
              <div className="caja-detalles-conflicto">
                <div className="fila-detalle-conflicto">
                  <span className="etiqueta-conflicto">Tour existente:</span>
                  <strong>{alertaConflicto.detalles.tour_existente}</strong>
                </div>
                <div className="fila-detalle-conflicto">
                  <span className="etiqueta-conflicto">Fecha reservada:</span>
                  <span>{alertaConflicto.detalles.fecha}</span>
                </div>
                <div className="fila-detalle-conflicto">
                  <span className="etiqueta-conflicto">Horario existente:</span>
                  <strong style={{ color: '#b91c1c' }}>
                    {alertaConflicto.detalles.hora_inicio} a {alertaConflicto.detalles.hora_fin}
                  </strong>
                </div>
                {alertaConflicto.detalles.hora_nueva_inicio && (
                  <div className="fila-detalle-conflicto" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '4px' }}>
                    <span className="etiqueta-conflicto">Horario que intentas reservar:</span>
                    <span style={{ color: '#0284c7', fontWeight: '700' }}>
                      {alertaConflicto.detalles.hora_nueva_inicio} a {alertaConflicto.detalles.hora_nueva_fin}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="acciones-conflicto-modal">
              <button
                type="button"
                className="btn-entendido-conflicto"
                onClick={() => setAlertaConflicto(null)}
              >
                {language === 'en' ? 'Understood, choose another date or time' : 'Entendido, elegir otra fecha u horario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;
