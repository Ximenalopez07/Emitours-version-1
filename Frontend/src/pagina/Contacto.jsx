import React, { useState, useEffect, useRef, useContext } from "react";
import { enviarMensajeChatbot } from "../api";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { FaRobot, FaPaperPlane, FaUserLock, FaInfoCircle } from "react-icons/fa";
import "./Contacto.css";

const Contacto = () => {
  const { language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  const [mensajeInput, setMensajeInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      remitente: "bot",
      texto: t.chatbot_bienvenida,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [escribiendo, setEscribiendo] = useState(false);
  const messagesEndRef = useRef(null);

  // Autenticación de usuario
  const usuarioStr = localStorage.getItem("usuario");
  const token = localStorage.getItem("userToken") || localStorage.getItem("adminToken") || localStorage.getItem("token");
  const isAuthenticated = Boolean(usuarioStr && token);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, escribiendo]);

  // Actualizar mensaje de bienvenida si cambia el idioma
  useEffect(() => {
    setChatHistory(prev => {
      if (prev.length > 0 && prev[0].remitente === 'bot') {
        const copy = [...prev];
        copy[0] = { ...copy[0], texto: t.chatbot_bienvenida };
        return copy;
      }
      return prev;
    });
  }, [language]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!mensajeInput.trim() || !isAuthenticated) return;

    const textoUsuario = mensajeInput.trim();
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const nuevoHistorial = [
      ...chatHistory,
      { remitente: "usuario", texto: textoUsuario, hora: horaActual }
    ];

    setChatHistory(nuevoHistorial);
    setMensajeInput("");
    setEscribiendo(true);

    try {
      const res = await enviarMensajeChatbot({ mensaje: textoUsuario, language });
      const respuestaBot = res.data.respuesta || "I am unable to process this request.";
      
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
          texto: err.response?.data?.mensaje || t.chatbot_auth_requerida,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <div className="contacto-container">
      {/* ENCABEZADO TÍTULO BLANCO */}
      <div className="contacto-title-header">
        <h1>{t.contacto.toUpperCase()}</h1>
        <p>{language === 'en' ? 'Chat with our AI virtual assistant for immediate information and guidance.' : 'Chatea con nuestro asistente virtual con IA para información y orientación inmediata.'}</p>
      </div>

      {/* CONTENIDO CENTRADO */}
      <div className="contacto-main">
        {/* CHATBOT INTEGRADO EN VISTA (REEMPLAZA AL FORMULARIO DE CONTACTO) */}
        <div className="chatbot-embedded-card">
          <div className="chatbot-embedded-header">
            <div className="chatbot-avatar-icon">
              <FaRobot />
            </div>
            <div>
              <h2>{t.asistente_titulo}</h2>
              <p className="chatbot-status-tag">● {language === 'en' ? 'Online Assistant' : 'Asistente en Línea EmiTours'}</p>
            </div>
          </div>

          <div className="chatbot-disclaimer-banner">
            <FaInfoCircle className="disclaimer-icon" />
            <span>{t.chatbot_disclaimer}</span>
          </div>

          {!isAuthenticated ? (
            <div className="chatbot-embedded-auth-box">
              <FaUserLock className="lock-icon" />
              <h3>{t.asistente_titulo}</h3>
              <p>{t.chatbot_auth_requerida}</p>
              <div className="auth-buttons-group">
                <a href="/inicioseccion" className="btn-auth-action primary">
                  {t.chatbot_btn_login}
                </a>
                <a href="/inicioseccion" className="btn-auth-action secondary">
                  {t.chatbot_btn_registro}
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="chatbot-embedded-messages">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`embedded-bubble-wrapper ${msg.remitente}`}>
                    <div className="embedded-bubble">
                      <p>{msg.texto}</p>
                      <span className="embedded-time">{msg.hora}</span>
                    </div>
                  </div>
                ))}

                {escribiendo && (
                  <div className="embedded-bubble-wrapper bot">
                    <div className="embedded-bubble typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chatbot-embedded-form">
                <input
                  type="text"
                  placeholder={t.chatbot_placeholder}
                  value={mensajeInput}
                  onChange={(e) => setMensajeInput(e.target.value)}
                  disabled={escribiendo}
                />
                <button type="submit" disabled={!mensajeInput.trim() || escribiendo} className="btn-send-chat">
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>

        {/* INFORMACIÓN DE EMITOURS */}
        <div className="info-box">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8fqf0WQ9UT1ktN_Hd5yadyN8SQwLCbCxyRw&s" 
            className="info-logo"
            alt="logo"
          />
          <h3 className="info-title">Tu viaje comienza aquí</h3>
          <p className="info-text">
            En <b>EmiTours</b> transformamos tus ideas en experiencias 
            inolvidables. Permítenos acompañarte con profesionalismo, 
            energía y pasión por explorar Medellín y sus mejores destinos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contacto;
