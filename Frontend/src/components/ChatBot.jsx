import React, { useState, useEffect, useRef, useContext } from "react";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { enviarMensajeChatbot } from "../api";
import { FaRobot, FaPaperPlane, FaTimes, FaUserLock, FaUndo, FaCalendarAlt, FaMoneyBillWave, FaWhatsapp, FaTicketAlt } from "react-icons/fa";
import "./ChatBot.css";

const PREGUNTAS_MENU_ES = [
  { id: 1, texto: "1. ¿Qué lugares y tours ofrecen?" },
  { id: 2, texto: "2. ¿Cuáles son los precios de los tours?" },
  { id: 3, texto: "3. ¿Hay disponibilidad para Guatapé?" },
  { id: 4, texto: "4. ¿Cómo puedo reservar un tour?" },
  { id: 5, texto: "5. ¿Cuáles son los métodos de pago?" },
  { id: 6, texto: "6. ¿Qué horarios tienen los tours?" },
  { id: 7, texto: "7. ¿Qué guías turísticos tienen?" },
  { id: 8, texto: "8. ¿Cuáles son mis reservas?" },
  { id: 9, texto: "9. ¿Qué tour me recomiendan según mi presupuesto?" },
  { id: 10, texto: "10. ¿Cómo puedo contactar con EmiTours?" }
];

const PREGUNTAS_MENU_EN = [
  { id: 1, texto: "1. What places and tours do you offer?" },
  { id: 2, texto: "2. What are the tour prices?" },
  { id: 3, texto: "3. Is there availability for Guatapé?" },
  { id: 4, texto: "4. How can I book a tour?" },
  { id: 5, texto: "5. What are the payment methods?" },
  { id: 6, texto: "6. What schedules do the tours have?" },
  { id: 7, texto: "7. What tour guides do you have?" },
  { id: 8, texto: "8. What are my bookings?" },
  { id: 9, texto: "9. What tour do you recommend according to my budget?" },
  { id: 10, texto: "10. How can I contact EmiTours?" }
];

const ChatBot = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  hideFloatingButton = false,
  isEmbedded = false
}) => {
  const { language } = useContext(UIContext);
  const t = translations[language] || translations.es;
  const isEnglish = (language === 'en');
  const preguntasMenu = isEnglish ? PREGUNTAS_MENU_EN : PREGUNTAS_MENU_ES;

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isEmbedded ? true : (controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen);

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose(false);
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleToggle = () => {
    if (controlledOnClose) {
      controlledOnClose(!isOpen);
    } else {
      setInternalIsOpen(!isOpen);
    }
  };

  const [mensajeInput, setMensajeInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);

  // Estados interactivos para opciones especiales
  const [promptFechaActivo, setPromptFechaActivo] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [promptPresupuestoActivo, setPromptPresupuestoActivo] = useState(false);
  const [presupuestoInput, setPresupuestoInput] = useState("");

  const getMensajeBienvenida = () => ({
    remitente: "bot",
    texto: t.chatbot_bienvenida,
    mostrarMenu: true,
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [chatHistory, setChatHistory] = useState([getMensajeBienvenida()]);
  const messagesEndRef = useRef(null);

  // Autenticación de usuario
  const usuarioStr = localStorage.getItem("usuario");
  const token = localStorage.getItem("userToken") || localStorage.getItem("adminToken") || localStorage.getItem("token");
  const isAuthenticated = Boolean(usuarioStr && token);

  // Sincronizar bienvenida al cambiar idioma si solo está el mensaje inicial
  useEffect(() => {
    setChatHistory(prev => {
      if (prev.length === 1 && prev[0].remitente === "bot") {
        return [getMensajeBienvenida()];
      }
      return prev;
    });
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen, escribiendo, promptFechaActivo, promptPresupuestoActivo]);

  // Enviar consulta al backend
  const ejecutarConsulta = async ({ opcion, mensajeUsuario, fecha, presupuesto }) => {
    if (escribiendo) return;

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Agregar mensaje del usuario al historial
    const nuevoHistorial = [
      ...chatHistory,
      { remitente: "usuario", texto: mensajeUsuario, hora: horaActual }
    ];

    setChatHistory(nuevoHistorial);
    setMensajeInput("");
    setEscribiendo(true);
    setPromptFechaActivo(false);
    setPromptPresupuestoActivo(false);

    try {
      const res = await enviarMensajeChatbot({
        opcion,
        mensaje: mensajeUsuario,
        fecha,
        presupuesto,
        language
      });

      const data = res.data;
      const respuestaBot = data.respuesta || (isEnglish ? "I could not process your request." : "No pude procesar tu solicitud.");

      // Verificar si requiere ingreso de fecha (Opción 3) o presupuesto (Opción 9)
      if (data.requiereFecha) {
        setPromptFechaActivo(true);
      }
      if (data.requierePresupuesto) {
        setPromptPresupuestoActivo(true);
      }

      setChatHistory([
        ...nuevoHistorial,
        {
          remitente: "bot",
          texto: respuestaBot,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          accion: data.accion,
          mostrarMenu: data.mostrarMenu || false,
          mostrarBotonVolver: data.mostrarBotonVolver && !data.requiereFecha && !data.requierePresupuesto
        }
      ]);

    } catch (err) {
      console.error("Error al consultar chatbot:", err);
      setChatHistory([
        ...nuevoHistorial,
        {
          remitente: "bot",
          texto: err.response?.data?.mensaje || t.chatbot_auth_requerida || "Para utilizar nuestro asistente virtual debes registrarte e iniciar sesión.",
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mostrarBotonVolver: true
        }
      ]);
    } finally {
      setEscribiendo(false);
    }
  };

  // Selección de opción desde los botones del menú (1 a 10)
  const handleSeleccionarOpcion = (opcionObj) => {
    ejecutarConsulta({
      opcion: opcionObj.id,
      mensajeUsuario: opcionObj.texto
    });
  };

  // Volver al menú principal (opción 0)
  const handleVolverAlMenu = () => {
    setPromptFechaActivo(false);
    setPromptPresupuestoActivo(false);
    ejecutarConsulta({
      opcion: 0,
      mensajeUsuario: isEnglish ? "0. Back to menu" : "0. Volver al menú"
    });
  };

  // Enviar fecha para Guatapé (Opción 3)
  const handleEnviarFecha = (e) => {
    e.preventDefault();
    if (!fechaSeleccionada) return;
    ejecutarConsulta({
      opcion: 3,
      fecha: fechaSeleccionada,
      mensajeUsuario: isEnglish
        ? `3. Is there availability for Guatapé? [Date: ${fechaSeleccionada}]`
        : `3. ¿Hay disponibilidad para Guatapé? [Fecha: ${fechaSeleccionada}]`
    });
    setFechaSeleccionada("");
  };

  // Enviar presupuesto (Opción 9)
  const handleEnviarPresupuesto = (e) => {
    e.preventDefault();
    const valor = parseInt(presupuestoInput.replace(/\D/g, ''), 10);
    if (isNaN(valor) || valor <= 0) return;

    ejecutarConsulta({
      opcion: 9,
      presupuesto: valor,
      mensajeUsuario: isEnglish
        ? `9. What tour do you recommend according to my budget? [Budget: $${valor.toLocaleString()} COP]`
        : `9. ¿Qué tour me recomiendan según mi presupuesto? [Presupuesto: $${valor.toLocaleString()} COP]`
    });
    setPresupuestoInput("");
  };

  // Enviar mensaje libre / texto escrito por el usuario
  const handleSubmitInput = (e) => {
    e.preventDefault();
    if (!mensajeInput.trim() || escribiendo || !isAuthenticated) return;

    const texto = mensajeInput.trim();

    // Si el usuario escribe exactamente "0", regresar al menú
    if (texto === "0") {
      handleVolverAlMenu();
      setMensajeInput("");
      return;
    }

    // Si escribe un número del 1 al 10, mapear a la pregunta oficial
    const num = parseInt(texto, 10);
    if (!isNaN(num) && num >= 1 && num <= 10 && String(num) === texto) {
      const opc = preguntasMenu.find(p => p.id === num);
      if (opc) {
        ejecutarConsulta({
          opcion: num,
          mensajeUsuario: opc.texto
        });
        setMensajeInput("");
        return;
      }
    }

    // Si está activo el prompt de presupuesto y escribe un número
    if (promptPresupuestoActivo && /^\d+$/.test(texto.replace(/\D/g, ''))) {
      const valor = parseInt(texto.replace(/\D/g, ''), 10);
      if (valor > 0) {
        ejecutarConsulta({
          opcion: 9,
          presupuesto: valor,
          mensajeUsuario: isEnglish
            ? `9. What tour do you recommend according to my budget? [Budget: $${valor.toLocaleString()} COP]`
            : `9. ¿Qué tour me recomiendan según mi presupuesto? [Presupuesto: $${valor.toLocaleString()} COP]`
        });
        setMensajeInput("");
        return;
      }
    }

    // Para cualquier otro texto libre: enviar al backend, el cual responderá estrictamente
    // con la advertencia: "Por favor, selecciona un número del 1 al 10 para que pueda ayudarte. 😊"
    ejecutarConsulta({
      mensajeUsuario: texto
    });
    setMensajeInput("");
  };

  // Renderizado del contenido interno del chat
  const renderChatContent = () => (
    <div className={`chatbot-window ${isEmbedded ? 'embedded-mode' : ''}`}>
      {/* HEADER */}
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="bot-avatar">
            <FaRobot />
          </div>
          <div>
            <h3>{t.asistente_titulo || "Asistente EmiTours"}</h3>
            <span className="status-online">
              ● {language === 'en' ? 'Online | Menu Guided Assistant' : 'En línea | Asistente Guiado'}
            </span>
          </div>
        </div>
        {!isEmbedded && (
          <button className="btn-close-chat" onClick={handleClose} aria-label="Cerrar chat">
            <FaTimes />
          </button>
        )}
      </div>

      {/* CUERPO DEL CHAT / AUTENTICACIÓN REQUERIDA */}
      {!isAuthenticated ? (
        <div className="chatbot-auth-required">
          <FaUserLock className="lock-icon" />
          <h4>{t.chatbot_access_required || (isEnglish ? 'Access Required' : 'Acceso Requerido')}</h4>
          <p>{t.chatbot_auth_requerida || "Para utilizar nuestro asistente virtual debes registrarte e iniciar sesión."}</p>
          <a href="/inicioseccion" className="btn-go-login">
            {t.chatbot_btn_login || (isEnglish ? 'Sign In / Register' : 'Iniciar Sesión / Registrarme')}
          </a>
        </div>
      ) : (
        <>
          <div className="chatbot-messages-container">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-bubble-wrapper ${msg.remitente}`}>
                <div className="chat-bubble">
                  <p>{msg.texto}</p>

                  {/* BOTÓN DE ACCIÓN ESPECÍFICO (IR A RESERVAS O ABRIR WHATSAPP) */}
                  {msg.accion && (
                    <div className="chat-bubble-action">
                      {msg.accion.tipo === 'ir_reservas' && (
                        <a href={msg.accion.url} className="btn-chat-action reserves">
                          <FaTicketAlt /> {msg.accion.texto}
                        </a>
                      )}
                      {msg.accion.tipo === 'abrir_whatsapp' && (
                        <a href={msg.accion.url} target="_blank" rel="noopener noreferrer" className="btn-chat-action whatsapp">
                          <FaWhatsapp /> {msg.accion.texto}
                        </a>
                      )}
                    </div>
                  )}

                  {/* MENÚ DE PREGUNTAS ENUMERADAS (1 A 10) */}
                  {msg.mostrarMenu && (
                    <div className="chatbot-menu-grid">
                      {preguntasMenu.map((opc) => (
                        <button
                          key={opc.id}
                          className="chatbot-menu-btn"
                          onClick={() => handleSeleccionarOpcion(opc)}
                          disabled={escribiendo}
                        >
                          <span className="menu-btn-num">{opc.id}</span>
                          <span className="menu-btn-label">{opc.texto.replace(/^[0-9]+\.\s*/, '')}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* BOTÓN INDEPENDIENTE "VOLVER AL MENÚ" */}
                  {msg.mostrarBotonVolver && (
                    <div className="chat-bubble-return">
                      <button
                        className="btn-volver-menu"
                        onClick={handleVolverAlMenu}
                        disabled={escribiendo}
                      >
                        <FaUndo /> {t.chatbot_btn_volver_menu || (isEnglish ? "Back to menu" : "Volver al menú")} (0)
                      </button>
                    </div>
                  )}

                  <span className="chat-timestamp">{msg.hora}</span>
                </div>
              </div>
            ))}

            {/* PROMPT DE FECHA (OPCIÓN 3: GUATAPÉ) */}
            {promptFechaActivo && (
              <div className="chat-bubble-wrapper bot">
                <div className="chat-bubble prompt-box">
                  <form onSubmit={handleEnviarFecha} className="chatbot-prompt-form">
                    <label>
                      <FaCalendarAlt /> {isEnglish ? "Select date:" : "Selecciona una fecha:"}
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={fechaSeleccionada}
                      onChange={(e) => setFechaSeleccionada(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="prompt-buttons">
                      <button type="submit" className="btn-prompt-confirm">
                        {t.chatbot_fecha_btn || (isEnglish ? "Check availability" : "Verificar disponibilidad")}
                      </button>
                      <button type="button" className="btn-prompt-cancel" onClick={handleVolverAlMenu}>
                        {t.chatbot_btn_volver_menu || "Volver al menú"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* PROMPT DE PRESUPUESTO (OPCIÓN 9: RECOMENDACIÓN) */}
            {promptPresupuestoActivo && (
              <div className="chat-bubble-wrapper bot">
                <div className="chat-bubble prompt-box">
                  <form onSubmit={handleEnviarPresupuesto} className="chatbot-prompt-form">
                    <label>
                      <FaMoneyBillWave /> {isEnglish ? "Budget amount in COP:" : "Monto de presupuesto en COP:"}
                    </label>
                    <div className="input-currency-wrapper">
                      <span className="currency-prefix">$</span>
                      <input
                        type="number"
                        min="10000"
                        step="5000"
                        placeholder="100000"
                        value={presupuestoInput}
                        onChange={(e) => setPresupuestoInput(e.target.value)}
                        required
                        autoFocus
                      />
                      <span className="currency-suffix">COP</span>
                    </div>
                    <div className="prompt-buttons">
                      <button type="submit" className="btn-prompt-confirm">
                        {t.chatbot_presupuesto_btn || (isEnglish ? "Check tours" : "Consultar tours")}
                      </button>
                      <button type="button" className="btn-prompt-cancel" onClick={handleVolverAlMenu}>
                        {t.chatbot_btn_volver_menu || "Volver al menú"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* INDICADOR DE CARGA */}
            {escribiendo && (
              <div className="chat-bubble-wrapper bot">
                <div className="chat-bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORMULARIO INFERIOR */}
          <form onSubmit={handleSubmitInput} className="chatbot-input-form">
            <input
              type="text"
              placeholder={t.chatbot_placeholder || (isEnglish ? "Type a number 1-10 (or 0 for menu)..." : "Escribe un número del 1 al 10 (o 0 para menú)...")}
              value={mensajeInput}
              onChange={(e) => setMensajeInput(e.target.value)}
              disabled={escribiendo}
            />
            <button
              type="submit"
              disabled={!mensajeInput.trim() || escribiendo}
              title={isEnglish ? "Send option number" : "Enviar número de opción"}
            >
              <FaPaperPlane />
            </button>
          </form>
        </>
      )}
    </div>
  );

  // Si se renderiza en modo integrado (ej. /Contacto)
  if (isEmbedded) {
    return (
      <div className="chatbot-embedded-container">
        {renderChatContent()}
      </div>
    );
  }

  // Si se renderiza en modo flotante global
  return (
    <div className="chatbot-floating-wrapper">
      {!hideFloatingButton && (
        <button
          className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
          onClick={handleToggle}
          title={t.asistente_titulo || "Asistente Virtual EmiTours"}
          aria-label="Abrir asistente virtual"
        >
          {isOpen ? <FaTimes /> : <FaRobot className="bot-icon-anim" />}
          <span className="chatbot-badge-pulse"></span>
        </button>
      )}

      {isOpen && renderChatContent()}
    </div>
  );
};

export default ChatBot;
