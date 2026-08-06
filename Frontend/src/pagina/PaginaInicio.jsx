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

        <div className="lugar-section">

          <h3>Comuna 13</h3>

          <div
            id="carouselComuna13"
            className="carousel slide"
            data-bs-ride="carousel"
          >

            <div className="carousel-inner">

              <div className="carousel-item active">
                <img
                  src="https://media.tacdn.com/media/attractions-splice-spp-674x446/17/06/32/e8.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Comuna 13"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/6c/a5/ef/ven-y-dejate-contar-la.jpg?w=900&h=500&s=1"
                  className="d-block w-100 carousel-img"
                  alt="Comuna 13"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://bogotacitybus.co/wp-content/uploads/2025/07/tour_comuna_13_medellin.webp"
                  className="d-block w-100 carousel-img"
                  alt="Comuna 13"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/96/a2/09.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Comuna 13"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://cloudfront-us-east-1.images.arcpublishing.com/elespectador/FVCR3CPZA5CAXAM6VFYVIPSIEI.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Comuna 13"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://visitmedellin.co/wp-content/uploads/2026/02/Comuna-13-92-1200x675.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Comuna 13"
                />
              </div>

            </div>

            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#carouselComuna13"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon"></span>
            </button>

            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#carouselComuna13"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon"></span>
            </button>

          </div>
        </div>

        {/* ================= PUEBLITO PAISA ================= */}

        <div className="lugar-section">

          <h3>Pueblito Paisa</h3>

          <div
            id="carouselPueblito"
            className="carousel slide"
            data-bs-ride="carousel"
          >

            <div className="carousel-inner">

              <div className="carousel-item active">
                <img
                  src="https://cdn.colombia.com/sdi/2013/12/04/cerro-nutibara-y-pueblito-paisa-797390.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Pueblito Paisa"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://imagenes2.eltiempo.com/files/og_thumbnail/uploads/2022/04/06/624db3d2d6035.jpeg"
                  className="d-block w-100 carousel-img"
                  alt="Pueblito Paisa"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9RAFEHDa4AdZDQ9_szspfOKG3G-K0tby_IA&s"
                  className="d-block w-100 carousel-img"
                  alt="Pueblito Paisa"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://www.besame.fm/wp-content/uploads/2024/11/21112024-que-hacer-en-el-pueblito-paisa.png"
                  className="d-block w-100 carousel-img"
                  alt="Pueblito Paisa"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQulLxVtszdM7TFcnAOa2MtGsDo8Aan_-aFog&s"
                  className="d-block w-100 carousel-img"
                  alt="Pueblito Paisa"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://i.ytimg.com/vi/1fPOcxXTJAk/maxresdefault.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Pueblito Paisa"
                />
              </div>

            </div>

            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#carouselPueblito"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon"></span>
            </button>

            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#carouselPueblito"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon"></span>
            </button>

          </div>
        </div>

        {/* ================= GUATAPÉ ================= */}

        <div className="lugar-section">

          <h3>Guatapé</h3>

          <div
            id="carouselGuatape"
            className="carousel slide"
            data-bs-ride="carousel"
          >

            <div className="carousel-inner">

              <div className="carousel-item active">
                <img
                  src="https://cms.w2m.com/dam/Sites/Imagenes-TTOO/AMERICA/Colombia/Otros-Colombia/penol.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Guatapé"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/b9/ed/93/piedra-del-penol.jpg?w=1400&h=-1&s=1"
                  className="d-block w-100 carousel-img"
                  alt="Guatapé"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv4G-oS5A_K9M1xV8j633X74kS_frESgDSPQ&s"
                  className="d-block w-100 carousel-img"
                  alt="Guatapé"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://preview.redd.it/pe%C3%B1ol-de-guatap%C3%A9-la-mejor-vista-del-mundo-v0-02wjinwe61zg1.jpg?width=4032&format=pjpg&auto=webp&s=ccb2df74e67c17fda342c2a755ecc0537b53edfe"
                  className="d-block w-100 carousel-img"
                  alt="Guatapé"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://panoramacultural.com.co/media/images/articulos/2023/02/02170525.jpg"
                  className="d-block w-100 carousel-img"
                  alt="Guatapé"
                />
              </div>

              <div className="carousel-item">
                <img
                  src="https://imagenes2.eltiempo.com/files/image_1200_535/uploads/2024/03/07/65e9dd6eb5e78.jpeg"
                  className="d-block w-100 carousel-img"
                  alt="Guatapé"
                />
              </div>

            </div>

            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#carouselGuatape"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon"></span>
            </button>

            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#carouselGuatape"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon"></span>
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}

export default PaginaInicio;