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

const Reservas = () => {
  const { language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  const [tours, setTours] = useState([
    {
      id: 1,
      nombre: "Tour Comuna 13",
      descripcion: "Grafitis, escaleras eléctricas y la historia de transformación urbana de Medellín.",
      precio: 80000,
      duracion: "4 Horas",
      cupos: 20,
      imagen: "https://images.unsplash.com/photo-1599818816401-bc8b375b48bd?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 2,
      nombre: "Tour Guatapé y El Peñol",
      descripcion: "Sube a la majestuosa Piedra del Peñol y navega en barco por el embalse.",
      precio: 150000,
      duracion: "Full Day (8 hrs)",
      cupos: 20,
      imagen: "https://images.unsplash.com/photo-1599818816401-bc8b375b48bd?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 3,
      nombre: "Tour Parque Arví",
      descripcion: "Viaje en Metrocable sobre el bosque de niebla y senderismo en la naturaleza.",
      precio: 95000,
      duracion: "5 Horas",
      cupos: 20,
      imagen: "https://images.unsplash.com/photo-1599818816401-bc8b375b48bd?auto=format&fit=crop&q=80&w=600"
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
  const [metodoPago, setMetodoPago] = useState("Nequi");
  const [opcionPago, setOpcionPago] = useState("Pagar ahora");
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorForm, setErrorForm] = useState(null);

  const usuarioStr = localStorage.getItem("usuario");
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resTours = await getLugares();
      if (resTours.data && resTours.data.length > 0) {
        setTours(resTours.data);
      }
    } catch (e) {
      console.warn("Usando tours por defecto");
    }

    if (usuario) {
      try {
        const resMisRes = await getReservas({ usuario_id: usuario.id_registro || usuario.id });
        if (resMisRes.data) {
          setMisReservas(resMisRes.data);
        }
      } catch (e) {
        console.error("Error al cargar historial de reservas", e);
      }
    }
  };

  const abrirFormularioReserva = (tour) => {
    const usuarioActual = localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")) : usuario;
    if (!usuarioActual) {
      alert(t.chatbot_auth_requerida || "Debes iniciar sesión para realizar una reserva.");
      return;
    }
    setSelectedTour(tour);
    setNombreCompleto(usuarioActual.nombre_usuario || usuarioActual.nombre || "Usuario");
    setCelular(usuarioActual.telefono || usuarioActual.celular || "3001234567");
    setNumeroPersonas(1);
    setFechaTour("");
    setHoraTour("07:00 AM");
    setIdiomaTour("es");
    setMetodoPago("Nequi");
    setOpcionPago(t.pagar_ahora || "Pagar ahora");
    setMensajeExito(null);
    setErrorForm(null);
  };

  const handleSubmitReserva = async (e) => {
    e.preventDefault();
    setErrorForm(null);

    const usuarioActual = localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")) : usuario;
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
    const opcionPagoFinal = opcionPago || (t.pagar_ahora || "Pagar ahora");

    try {
      const payload = {
        usuario_id: usuarioId,
        lugar_id: selectedTour.id,
        numero_personas: cantidadPersonas,
        fecha: fechaTour,
        hora: horaFinal,
        idioma: idiomaFinal,
        metodo_pago: metodoPagoFinal,
        opcion_pago: opcionPagoFinal
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
          opcion: opcionPagoFinal,
          total: (selectedTour.precio || 150000) * cantidadPersonas
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
              <p><strong>{t.col_personas}:</strong> {mensajeExito.personas} personas</p>
              <p><strong>{t.col_idioma}:</strong> {mensajeExito.idioma === 'en' ? '🇬🇧 Inglés' : '🇪🇸 Español'}</p>
              <p><strong>{t.col_metodo_pago}:</strong> {mensajeExito.metodo}</p>
              <p><strong>{t.col_opcion_pago}:</strong> {mensajeExito.opcion}</p>
              <p><strong>{t.total_estimado}:</strong> ${mensajeExito.total.toLocaleString()} COP</p>
              <p className="estado-badge">{t.estado_pendiente}</p>
            </div>

            <button className="btn-confirmar-modal" onClick={() => setMensajeExito(null)}>
              ¡Entendido!
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
              <span className="cupos-tag">20 {t.cupos_disponibles_tag}</span>
            </div>

            <div className="tour-card-body">
              <h3>{tour.nombre || tour.title}</h3>
              <p className="tour-desc">{tour.descripcion || tour.desc}</p>
              
              <div className="tour-meta-row">
                <span>⏱️ {tour.duracion || tour.duration || '4 Horas'}</span>
                <span className="tour-precio">${(tour.precio || 150000).toLocaleString()} COP</span>
              </div>

              <p className="tour-detalles">{tour.servicios || 'Tour completo con guía experto y seguro de asistencia'}</p>

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

              <label>{t.metodo_pago} *</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} required>
                {METODOS_PAGO_PERMITIDOS.map((mp, index) => (
                  <option key={index} value={mp}>{mp}</option>
                ))}
              </select>

              <label>{t.opcion_pago} *</label>
              <div className="opciones-pago-radio">
                <label className={`radio-card ${opcionPago === t.pagar_ahora ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="opcionPago"
                    value={t.pagar_ahora}
                    checked={opcionPago === t.pagar_ahora}
                    onChange={() => setOpcionPago(t.pagar_ahora)}
                  />
                  <span>💳 {t.pagar_ahora}</span>
                </label>

                <label className={`radio-card ${opcionPago === t.pagar_despues ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="opcionPago"
                    value={t.pagar_despues}
                    checked={opcionPago === t.pagar_despues}
                    onChange={() => setOpcionPago(t.pagar_despues)}
                  />
                  <span>🤝 {t.pagar_despues}</span>
                </label>
              </div>

              <div className="total-preview">
                <span>{t.total_estimado}:</span>
                <strong>${((selectedTour.precio || 150000) * (parseInt(numeroPersonas, 10) || 1)).toLocaleString()} COP</strong>
              </div>

              <button type="submit" className="btn-confirmar-modal">
                {t.confirmar_reserva}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TABLA HISTORIAL DE RESERVAS REGISTRADAS */}
      {usuario && misReservas.length > 0 && (
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
                  <th>{t.col_opcion_pago}</th>
                  <th>{t.col_total}</th>
                  <th>{t.col_estado}</th>
                  <th>{t.col_estado_pago}</th>
                </tr>
              </thead>
              <tbody>
                {misReservas.map((r) => (
                  <tr key={r.id}>
                    <td><code className="codigo-tag">{r.codigo || `RES-${r.id}`}</code></td>
                    <td><strong>{r.lugar_nombre || 'Tour EmiTours'}</strong></td>
                    <td>{r.fecha ? r.fecha.toString().substring(0, 10) : 'Pendiente'} - {r.hora}</td>
                    <td>{r.numero_personas} pers</td>
                    <td>{r.idioma === 'en' ? '🇬🇧 Inglés' : '🇪🇸 Español'}</td>
                    <td>{r.metodo_pago || 'Nequi'}</td>
                    <td><small>{r.opcion_pago || 'Pagar ahora'}</small></td>
                    <td>${(r.precio_total || 150000).toLocaleString()} COP</td>
                    <td>
                      <span className={`estado-pill ${r.estado ? r.estado.toLowerCase() : 'pendiente'}`}>
                        {r.estado || 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-pill ${r.estado_pago && r.estado_pago.includes('finalizar') ? 'pagar-despues' : (r.estado_pago ? r.estado_pago.toLowerCase() : 'pendiente')}`}>
                        {r.estado_pago || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;
