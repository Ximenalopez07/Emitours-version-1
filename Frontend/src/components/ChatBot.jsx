import React, { useState, useEffect, useRef } from "react";
import { enviarMensajeChatbot } from "../api";
import { FaRobot, FaPaperPlane, FaTimes, FaUserLock, FaComments } from "react-icons/fa";
import "./ChatBot.css";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajeInput, setMensajeInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      remitente: "bot",
      texto: "¡Hola! 🏔️ Soy el Asistente Virtual con IA de EmiTours. ¿En qué puedo ayudarte hoy?",
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [escribiendo, setEscribiendo] = useState(false);

  const messagesEndRef = useRef(null);

  // Obtener usuario autenticado
  const usuarioStr = localStorage.getItem("usuario");
  const token = localStorage.getItem("userToken") || localStorage.getItem("adminToken") || localStorage.getItem("token");
  const isAuthenticated = Boolean(usuarioStr && token);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen, escribiendo]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!mensajeInput.trim() || !isAuthenticated) return;

    const textoUsuario = mensajeInput.trim();
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Agregar mensaje del usuario
    const nuevoHistorial = [
      ...chatHistory,
      { remitente: "usuario", texto: textoUsuario, hora: horaActual }
    ];
    setChatHistory(nuevoHistorial);
    setMensajeInput("");
    setEscribiendo(true);

    try {
      const res = await enviarMensajeChatbot({ mensaje: textoUsuario });
      const respuestaBot = res.data.respuesta || "Lo siento, no pude procesar tu mensaje.";
      
      setChatHistory([
        ...nuevoHistorial,
        {
          remitente: "bot",
          texto: respuestaBot,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error("Error enviando mensaje al ChatBot:", err);
      setChatHistory([
        ...nuevoHistorial,
        {
          remitente: "bot",
          texto: err.response?.data?.mensaje || "Para utilizar nuestro asistente virtual debes registrarte e iniciar sesión.",
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <div className="chatbot-floating-wrapper">
      {/* BOTÓN FLOTANTE INFERIOR DERECHA */}
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Asistente Virtual IA EmiTours"
      >
        {isOpen ? <FaTimes /> : <FaRobot className="bot-icon-anim" />}
        <span className="chatbot-badge-pulse"></span>
      </button>

      {/* VENTANA FLOTANTE DE CHAT */}
      {isOpen && (
        <div className="chatbot-window">
          {/* HEADER */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="bot-avatar">
                <FaRobot />
              </div>
              <div>
                <h3>Asistente IA EmiTours</h3>
                <span className="status-online">● En línea | Consulta en tiempo real</span>
              </div>
            </div>
            <button className="btn-close-chat" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          {/* CUERPO DE CONVERSACIÓN / MENSAJE SI NO ESTÁ AUTENTICADO */}
          {!isAuthenticated ? (
            <div className="chatbot-auth-required">
              <FaUserLock className="lock-icon" />
              <h4>Acceso Requerido</h4>
              <p>Para utilizar nuestro asistente virtual debes registrarte e iniciar sesión.</p>
              <a href="/inicioseccion" className="btn-go-login">
                Iniciar Sesión / Registrarme
              </a>
            </div>
          ) : (
            <>
              <div className="chatbot-messages-container">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`chat-bubble-wrapper ${msg.remitente}`}>
                    <div className="chat-bubble">
                      <p>{msg.texto}</p>
                      <span className="chat-timestamp">{msg.hora}</span>
                    </div>
                  </div>
                ))}

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

              {/* INPUT FORMULARIO */}
              <form onSubmit={handleSendMessage} className="chatbot-input-form">
                <input
                  type="text"
                  placeholder="Pregunta sobre tours, cupos o tus reservas..."
                  value={mensajeInput}
                  onChange={(e) => setMensajeInput(e.target.value)}
                  disabled={escribiendo}
                />
                <button type="submit" disabled={!mensajeInput.trim() || escribiendo}>
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBot;
