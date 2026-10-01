import React, { useState, useEffect, useContext } from "react";
import { UIContext } from "../context/UIContext";
import { getLugares, getReservas, createReserva } from "../api";
import { translations } from "../utils/translations";
import "./reservas.css";

// MÉTODOS DE PAGO PERMITIDOS (ÚNICAMENTE 4)
const METODOS_PAGO_PERMITIDOS = ['Nequi', 'PSE', 'Pago en efectivo', 'Datáfono'];

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
    descripcion_en: "Historical and informative tour on the impact, memory, and social transformation of the Pablo Escobar era in Medellín.",
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

  useEffect(() => {
    if (!user) {
      setMisReservas([]);
      setNombreCompleto("");
      setCelular("");
    }
    cargarDatos();
  }, [user]);

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
    setMetodoPago("Nequi");
    setMensajeExito(null);
    setErrorForm(null);
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
      const payload = {
        usuario_id: usuarioId,
        lugar_id: selectedTour.id,
        numero_personas: cantidadPersonas,
        fecha: fechaTour,
        hora: horaFinal,
        idioma: idiomaFinal,
        metodo_pago: metodoPagoFinal,
        opcion_pago: esPagoTotal ? "Pagar el total" : "Pagar el 50%",
        precio_total: precioTotalCalculado
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
          metodo: metodoPagoFinal,
          total: precioTotalCalculado,
          pagoInicial: pagoInicialCalculado,
          saldoPendiente: saldoPendienteCalculado
        });

        setSelectedTour(null);
        cargarDatos();
      } else {
        setErrorForm(res.data?.mensaje || "Error al procesar reserva");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.mensaje || err.message || "Error al realizar reserva";
      setErrorForm(msg);
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
              <p className="estado-badge">{t.estado_pendiente}</p>
            </div>

            <button className="btn-confirmar-modal" onClick={() => setMensajeExito(null)}>
              {language === 'en' ? 'Understood!' : '¡Entendido!'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
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
                    {mp === 'Pago en efectivo' && language === 'en' ? 'Cash payment' : (mp === 'Datáfono' && language === 'en' ? 'Card Terminal' : mp)}
                  </option>
                ))}
              </select>

              <button type="submit" className="btn-confirmar-modal" style={{ marginTop: '16px' }}>
                {tipoPago === 'total' 
                  ? `${t.confirmar_reserva} (${language === 'en' ? 'Pay 100%' : 'Pagar 100%'})` 
                  : `${t.confirmar_reserva} (${language === 'en' ? 'Deposit 50%' : 'Abonar 50%'})`}
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
                </tr>
              </thead>
              <tbody>
                {misReservas.map((r) => {
                  const esPagado = (r.estado_pago || '').toLowerCase().includes('pagad');
                  const tot = Number(r.precio_total || 0);
                  const abono = esPagado ? tot : Math.round(tot * 0.5);
                  const pendiente = esPagado ? 0 : (tot - abono);

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
