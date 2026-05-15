import "./PaginaInicio.css";
import heroImg from "../assets/comuna13.jpg"; 
import logo from "../assets/logo.jpg"; // <-- Logo

function PaginaInicio() {
  return (
    <div className="home">

      {/* HERO */}
      <section 
        className="hero-section"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="overlay"></div>

        <div className="hero-content">
          <h1 className="hero-title">Descubre Medellín con EmiTours</h1>
          <p className="hero-text">
            Explora la ciudad de la eterna primavera de una forma única:
            cultura, historia, aventura y los lugares más icónicos de Medellín.
          </p>
          <a href="/lugares" className="hero-btn">Ver Tours</a>
        </div>
      </section>

      {/* SECCIÓN SOBRE NOSOTROS */}
      <section className="sobre-nosotros">

        <div className="sobre-contenido">

          {/* LOGO A UN LADO */}
          <img 
            src={logo} 
            alt="Logo Ruta Tours" 
            className="logo-sobre-nosotros"
          />

          {/* TEXTO AL LADO */}
          <div className="texto-sobre-nosotros">
            <h2>¿Quiénes Somos?</h2>
            <p>
              Somos una agencia turística apasionada por contar la historia real de Medellín.
              Nuestros guías locales convertirán cada recorrido en una experiencia auténtica,
              segura y llena de cultura. ¡Viajar con EmiTours es viajar con familia!
            </p>
          </div>

        </div>

      </section>

      {/* DESTACADOS */}
      <section className="destacados">
        <h2>Lugares Destacados</h2>

        <div className="destacados-grid">
          <div className="dest-card">
            <img src="https://bogotacitybus.co/wp-content/uploads/2025/07/tour_comuna_13_medellin.webp"/>
            <h3>Comuna 13</h3>
          </div>

          <div className="dest-card">
            <img src="https://i.pinimg.com/736x/3b/8e/ef/3b8eefe2bbfaeba75de0794af362df84.jpg" />
            <h3>Pueblito Paisa</h3>
          </div>

          <div className="dest-card">
            <img src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/442653025.jpg?k=4190933bccf034196bc23d1ce77278a137b68d5a71ec075bb875f5119c6363e9&o=" />
            <h3>Guatapé</h3>
          </div>
        </div>
      </section>

    </div>
  );
}

export default PaginaInicio;