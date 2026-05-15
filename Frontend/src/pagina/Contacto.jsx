import "./Contacto.css";

const Contacto = () => {
  return (
    <div className="contacto-container">

      {/* HEADER */}
      <div className="contacto-header">
        <img 
          src="/images/contacto-banner.jpg" 
          alt="header"
          className="header-img"
        />
        <div className="header-soft-overlay"></div>
        <h1 className="header-title">CONTACTO</h1>
      </div>

      {/* CONTENIDO CENTRADO */}
      <div className="contacto-main">

        {/* FORMULARIO */}
        <div className="form-box">
          <h2 className="form-title">¡Hablemos!</h2>
          <p className="form-subtitle">Estamos listos para ayudarte con tu próxima aventura.</p>

          <label>Nombre Completo *</label>
          <input type="text" required />

          <label>Correo Electrónico *</label>
          <input type="email" required />

          <label>Teléfono *</label>
          <input type="text" required />

          <label>Mensaje *</label>
          <textarea required></textarea>

          <button className="btn-azul">Enviar Mensaje</button>
        </div>

        {/* INFORMACIÓN */}
        <div className="info-box">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8fqf0WQ9UT1ktN_Hd5yadyN8SQwLCbCxyRw&s" 
            className="info-logo"
            alt="logo"
          />

          <h3 className="info-title">Tu viaje comienza aquí</h3>
          <p className="info-text">
            En <b>RutaTours</b> transformamos tus ideas en experiencias 
            inolvidables. Permítenos acompañarte con profesionalismo, 
            energía y pasión por explorar nuevos destinos.
          </p>
        </div>

      </div>

      {/* IMAGEN DE WHATSAPP ABAJO A LA DERECHA */}
      <img 
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcpzs2ex8QaGUsVUNkG4kzeW9dZL8eweooog&s"
        alt="WhatsApp"
        className="whatsapp-bottom"
      />

    </div>
  );
};

export default Contacto;
