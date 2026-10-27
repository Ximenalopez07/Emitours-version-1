import React, { useContext, useEffect } from "react";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import ChatBot from "../components/ChatBot";
import "./Contacto.css";

const Contacto = () => {
  const { language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="contacto-container">
      {/* ENCABEZADO TÍTULO BLANCO */}
      <div className="contacto-title-header">
        <h1>{t.contacto.toUpperCase()}</h1>
        <p>{t.contacto_subtitulo || (language === 'en' ? 'Chat with our virtual assistant for immediate information and guidance.' : 'Chatea con nuestro asistente virtual para información y orientación inmediata.')}</p>
      </div>

      {/* CONTENIDO CENTRADO */}
      <div className="contacto-main">
        {/* CHATBOT INTEGRADO EN VISTA */}
        <div className="chatbot-embedded-card">
          <ChatBot isEmbedded={true} />
        </div>

        {/* INFORMACIÓN DE EMITOURS */}
        <div className="info-box">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8fqf0WQ9UT1ktN_Hd5yadyN8SQwLCbCxyRw&s" 
            className="info-logo"
            alt="logo"
          />
          <h3 className="info-title">{t.contacto_info_title || "Tu viaje comienza aquí"}</h3>
          <p className="info-text">
            {t.contacto_info_text || "En EmiTours transformamos tus ideas en experiencias inolvidables. Permítenos acompañarte con profesionalismo, energía y pasión por explorar Medellín y sus mejores destinos."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contacto;

