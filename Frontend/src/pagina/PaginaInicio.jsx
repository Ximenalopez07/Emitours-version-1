import React, { useContext, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { getLugares } from "../api";
import { FaChevronLeft, FaChevronRight, FaArrowRight } from "react-icons/fa";
import ChatBot from "../components/ChatBot";
import "./PaginaInicio.css";

// Assets
import heroImg from "../assets/comuna13.jpg";
import logo from "../assets/logo.jpg";
import robotImg from "../assets/robot-asistente.jpg";

// Componente individual de Carrusel Horizontal para cada lugar
function PlaceCarousel({ place }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const images = place.imagenes && place.imagenes.length > 0 ? place.imagenes : [heroImg];

  // Cambio automático suave cada 5.5 segundos (pausa al hacer hover)
  useEffect(() => {
    if (isHovered || images.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isHovered, images.length]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Deslizar izquierda -> siguiente
        setActiveIndex((prev) => (prev + 1) % images.length);
      } else {
        // Deslizar derecha -> anterior
        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }
  };

  return (
    <div
      className="place-carousel-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Contenedor de diapositivas */}
      <div className="carousel-slides-track">
        {images.map((imgSrc, idx) => (
          <div
            key={idx}
            className={`carousel-slide-item ${idx === activeIndex ? "active" : ""}`}
            style={{ backgroundImage: `url(${imgSrc})` }}
          >
            {/* Imagen oculta para fallback y accesibilidad */}
            <img
              src={imgSrc}
              alt={`${place.nombre} - foto ${idx + 1}`}
              className="carousel-hidden-img"
              loading="lazy"
              onError={(e) => {
                e.target.parentElement.style.backgroundImage = `url(${heroImg})`;
              }}
            />
          </div>
        ))}
      </div>

      {/* Overlay oscuro suave con degradado moderno para máxima legibilidad */}
      <div className="carousel-gradient-overlay"></div>

      {/* Flechas de navegación izquierda / derecha */}
      <button
        className="carousel-arrow prev-arrow"
        onClick={handlePrev}
        aria-label="Foto anterior"
        type="button"
      >
        <FaChevronLeft />
      </button>

      <button
        className="carousel-arrow next-arrow"
        onClick={handleNext}
        aria-label="Siguiente foto"
        type="button"
      >
        <FaChevronRight />
      </button>

      {/* Información del Lugar en la parte inferior */}
      <div className="carousel-bottom-content">
        <div className="carousel-text-group">
          <span className="carousel-tag">TOUR DESTACADO</span>
          <h3 className="carousel-place-title">{place.nombre}</h3>
          <p className="carousel-place-desc">{place.descripcion}</p>
        </div>

        {/* Indicadores de posición (puntos) y botón de acción */}
        <div className="carousel-footer-bar">
          <div className="carousel-dots-wrapper">
            {images.map((_, dotIdx) => (
              <button
                key={dotIdx}
                className={`carousel-dot ${dotIdx === activeIndex ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(dotIdx);
                }}
                aria-label={`Ir a foto ${dotIdx + 1}`}
                type="button"
              />
            ))}
          </div>

          <Link to="/lugares" className="carousel-explore-link">
            <span>Ver más detalles</span>
            <FaArrowRight className="link-arrow-icon" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PaginaInicio() {
  const { language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  // Estado para abrir y cerrar el ChatBot real funcional
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Lugares obtenidos de la API
  const [lugaresDB, setLugaresDB] = useState([]);

  useEffect(() => {
    getLugares()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setLugaresDB(res.data);
        }
      })
      .catch((err) => {
        console.error("Error al obtener lugares para el inicio:", err);
      });
  }, []);

  // Galería de imágenes existentes para cada uno de los 3 lugares solicitados
  const comuna13Imgs = [
    "https://media.tacdn.com/media/attractions-splice-spp-674x446/17/06/32/e8.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/6c/a5/ef/ven-y-dejate-contar-la.jpg?w=900&h=500&s=1",
    "https://bogotacitybus.co/wp-content/uploads/2025/07/tour_comuna_13_medellin.webp",
    "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/96/a2/09.jpg",
    "https://cloudfront-us-east-1.images.arcpublishing.com/elespectador/FVCR3CPZA5CAXAM6VFYVIPSIEI.jpg",
    "https://visitmedellin.co/wp-content/uploads/2026/02/Comuna-13-92-1200x675.jpg"
  ];

  const pueblitoPaisaImgs = [
    "https://cdn.colombia.com/sdi/2013/12/04/cerro-nutibara-y-pueblito-paisa-797390.jpg",
    "https://imagenes2.eltiempo.com/files/og_thumbnail/uploads/2022/04/06/624db3d2d6035.jpeg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9RAFEHDa4AdZDQ9_szspfOKG3G-K0tby_IA&s",
    "https://www.besame.fm/wp-content/uploads/2024/11/21112024-que-hacer-en-el-pueblito-paisa.png",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQulLxVtszdM7TFcnAOa2MtGsDo8Aan_-aFog&s",
    "https://i.ytimg.com/vi/1fPOcxXTJAk/maxresdefault.jpg"
  ];

  const guatapeImgs = [
    "https://cms.w2m.com/dam/Sites/Imagenes-TTOO/AMERICA/Colombia/Otros-Colombia/penol.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/b9/ed/93/piedra-del-penol.jpg?w=1400&h=-1&s=1",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv4G-oS5A_K9M1xV8j633X74kS_frESgDSPQ&s",
    "https://preview.redd.it/pe%C3%B1ol-de-guatap%C3%A9-la-mejor-vista-del-mundo-v0-02wjinwe61zg1.jpg?width=4032&format=pjpg&auto=webp&s=ccb2df74e67c17fda342c2a755ecc0537b53edfe",
    "https://panoramacultural.com.co/media/images/articulos/2023/02/02170525.jpg",
    "https://imagenes2.eltiempo.com/files/image_1200_535/uploads/2024/03/07/65e9dd6eb5e78.jpeg"
  ];

  // Helper para buscar datos en base de datos o usar los textos descriptivos reales
  const getPlaceData = (nombreBuscar, fallbackDesc, imagenes) => {
    const fromDB = lugaresDB.find(
      (l) => l.nombre && l.nombre.toLowerCase().includes(nombreBuscar.toLowerCase())
    );
    return {
      nombre: fromDB?.nombre || nombreBuscar,
      descripcion: fromDB?.descripcion || fallbackDesc,
      imagenes: imagenes
    };
  };

  const featuredPlaces = [
    getPlaceData(
      "Comuna 13",
      language === "en"
        ? "Urban art, history of resilience, live music, and the famous outdoor escalators."
        : "Arte, cultura y transformación urbana a través de sus calles, murales y escaleras eléctricas.",
      comuna13Imgs
    ),
    getPlaceData(
      "Pueblito Paisa",
      language === "en"
        ? "Traditional Antioquian town replica atop Nutibara Hill with 360° panoramic city views."
        : "Tradición y arquitectura antioqueña en la cima del Cerro Nutibara con vista panorámica 360°.",
      pueblitoPaisaImgs
    ),
    getPlaceData(
      "Guatapé",
      language === "en"
        ? "Colorful town of zócalos, boat ride on the reservoir, and the majestic Piedra del Peñol."
        : "El pueblo de los zócalos más colorido de Colombia, embalse navegable y la imponente Piedra del Peñol.",
      guatapeImgs
    )
  ];

  return (
    <div className="home-page-root">
      {/* ==================================================
          1. HERO PRINCIPAL
          ================================================== */}
      <section
        className="hero-section-modern"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="hero-dark-overlay"></div>

        <div className="hero-inner-container">
          <div className="hero-text-card">
            <span className="hero-welcome-badge">
              BIENVENIDO A EMITOURS
            </span>

            <h1 className="hero-main-title">
              Descubre Medellín<br />
              <span className="hero-title-highlight">de una manera diferente</span>
            </h1>

            <p className="hero-main-subtitle">
              Vive experiencias únicas, conoce lugares increíbles
              y explora la ciudad con nuestros guías locales.
            </p>

            <div className="hero-actions">
              <Link to="/lugares" className="hero-primary-btn">
                Explorar tours <span className="btn-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. BANNER COMPACTO DEL CHATBOT
          ================================================== */}
      <section className="chatbot-banner-wrapper">
        <div className="container">
          <div
            className="chatbot-banner-card"
            style={{ backgroundImage: `url(${heroImg})` }}
          >
            <div className="chatbot-banner-overlay"></div>

            <div className="chatbot-banner-inner">
              {/* LADO IZQUIERDO: TEXTO Y BOTÓN */}
              <div className="chatbot-banner-left">
                <span className="chatbot-banner-eyebrow">
                  ASISTENTE INTELIGENTE
                </span>
                <h3 className="chatbot-banner-title">
                  ¿Tienes preguntas?
                </h3>
                <p className="chatbot-banner-text">
                  Nuestro asistente virtual está disponible para ayudarte en todo momento.
                </p>
                <button
                  type="button"
                  className="chatbot-banner-cta-btn"
                  onClick={() => setIsChatOpen(true)}
                >
                  <span className="btn-chat-icon">💬</span>
                  <span>Hablar con el chatbot</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>

              {/* LADO DERECHO: GLOBO DE TEXTO + ROBOT */}
              <div className="chatbot-banner-right">
                <div className="chatbot-speech-bubble">
                  <span className="speech-badge">EmiTours AI</span>
                  <p className="speech-title">¡Hola!</p>
                  <p className="speech-body">
                    Soy el asistente virtual de <strong>EmiTours</strong>.<br />
                    ¿En qué puedo ayudarte?
                  </p>
                </div>

                <div
                  className="chatbot-robot-avatar"
                  onClick={() => setIsChatOpen(true)}
                  title="Abrir Asistente Virtual"
                >
                  <img
                    src={robotImg}
                    alt="Robot Asistente Virtual EmiTours"
                    className="chatbot-robot-graphic"
                  />
                  <span className="robot-status-dot" title="En línea"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. QUIÉNES SOMOS (2 COLUMNAS: LOGO + TEXTO)
          ================================================== */}
      <section className="quienes-somos-section">
        <div className="container">
          <div className="quienes-somos-card">
            <div className="quienes-somos-grid">
              {/* IZQUIERDA: LOGO OFICIAL DE EMITOURS */}
              <div className="quienes-somos-logo-col">
                <div className="quienes-somos-logo-box">
                  <img
                    src={logo}
                    alt="Logo Oficial EmiTours"
                    className="quienes-somos-logo-img"
                  />
                  <div className="logo-glow-accent"></div>
                </div>
              </div>

              {/* DERECHA: TEXTO EXPLICATIVO */}
              <div className="quienes-somos-text-col">
                <span className="section-pill-tag">QUIÉNES SOMOS</span>
                <h2 className="quienes-somos-heading">Somos EmiTours</h2>
                <p className="quienes-somos-paragraph">
                  {t.quienes_somos_desc ||
                    "Somos una agencia líder de turismo dedicada a brindar recorridos guiados inolvidables en Medellín y Antioquia con seguridad, comodidad y la mejor energía paisa."}
                </p>

                {/* Sutiles detalles decorativos de confianza y turismo */}
                <div className="quienes-somos-features">
                  <div className="feature-item">
                    <span className="feature-icon">🏔️</span>
                    <div>
                      <strong>Guías Expertos</strong>
                      <p>Acompañamiento local certificado</p>
                    </div>
                  </div>

                  <div className="feature-item">
                    <span className="feature-icon">🛡️</span>
                    <div>
                      <strong>100% Confiable</strong>
                      <p>Seguridad y puntualidad garantizada</p>
                    </div>
                  </div>

                  <div className="feature-item">
                    <span className="feature-icon">🌟</span>
                    <div>
                      <strong>Cultura Auténtica</strong>
                      <p>Historias reales de Medellín</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          4. LUGARES DESTACADOS (CARRUSELES HORIZONTALES)
          ================================================== */}
      <section className="lugares-destacados-section">
        <div className="container">
          <div className="destacados-title-block">
            <span className="section-pill-tag">EXPERIENCIAS IMPERDIBLES</span>
            <h2 className="destacados-section-title">Lugares Destacados</h2>
            <p className="destacados-section-subtitle">
              Disfruta cada rincón emblemático con nuestros recorridos diseñados para cautivarte.
            </p>
          </div>

          <div className="carousels-stack">
            {featuredPlaces.map((lugar) => (
              <PlaceCarousel key={lugar.nombre} place={lugar} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          CHATBOT FUNCIONAL REAL DEL PROYECTO
          Se abre únicamente al pulsar el botón del banner
          sin generar botón flotante circular invasivo
          ================================================== */}
      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        hideFloatingButton={true}
      />
    </div>
  );
}

export default PaginaInicio;