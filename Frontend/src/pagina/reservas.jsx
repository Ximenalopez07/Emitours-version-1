import { createReserva } from "../api";
import "./reservas.css";

const tours = [
  {
    id: 1,
    title: "TOUR A COMUNA 13",
    img: "data:image/jpeg;base64,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",
    description: [
      "Galerías de arte",
      "Casas Neon",
      "Museos",
      "Show de freestyle",
      "Miradores",
      "Show de trobas",
      "Escaleras eléctricas",
      "Historia y transformación",
      "(50 mil por persona)",
    ],
  },
  {
    id: 2,
    title: "TOUR A GAUTAPÉ",
    img: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/442653025.jpg?k=4190933bccf034196bc23d1ce77278a137b68d5a71ec075bb875f5119c6363e9&o=",
    description: [
      "Subida a la piedra del peñol",
      "Montada en barco o lancha por la represa",
      "Visita calle de los socalos y de sombrillas",
      "Visita de la réplica del viejo peñol",
      "Visita a la casa al revés",
      "Montar en helicóptero",
      "(200 mil por persona)",
    ],
  },
  {
    id: 3,
    title: "TOUR A PUEBLITO PAISA",
    img: "https://visitarmedellin.com/wp-content/uploads/2023/01/Pueblito-Paisa-Medellin.jpg",
    description: [
      "Visita al Cerro Nutibara con vista panorámicas a la ciudad",
      "Arquitectura y ambiente tradicional",
      "Gastronomía local",
      "Tiendas de artesanías y souvenirs",
      "Mirador",
      "(70 mil por persona)",
    ],
  },
  {
    id: 4,
    title: "TOUR A CITY TOURS",
    img: "https://medellinliving.com/wp-content/uploads/2017/08/1.jpg",
    description: [
      "Visitar el edificio gubernamental",
      "Parque de las luces",
      "Parque Botero",
      "Edificio Coltejer",
      "Y una de las primeras iglesias católicas",
      "(130 mil por persona)",
    ],
  },
  {
    id: 5,
    title: "TOUR A PABLO ESCOBAR",
    img: "https://paisatoursesmedellin.com/wp-content/uploads/2023/02/tour-pablo-escobar-medellin.jpg",
    description: [
      "Historia Pablo Escobar",
      "Lugar donde fue asesinado",
      "Museos",
      "Cementerio Montesacro",
      "Barrio Pablo Escobar que fue donado por él",
      "(130 mil por persona)",
    ],
  },
  {
    id: 6,
    title: "TOUR A METRO CABLE",
    img: "https://www.metrodemedellin.gov.co/hs-fs/hubfs/IFE_0785%20%281%29.jpg?width=648&height=403&name=IFE_0785%20%281%29.jpg",
    description: [
      "También podemos visitar uno de los metro cables que tenemos en la ciudad de Medellín",
      "(50 mil por persona)",
    ],
  },
];

const reservas = () => {
  const handleReservar = async (tourTitle) => {
    const userStr = localStorage.getItem("usuario");
    if (!userStr) {
      alert("❌ Debes iniciar sesión para reservar");
      return;
    }

    const user = JSON.parse(userStr);
    const fechaActual = new Date().toISOString().split('T')[0];
    const horaActual = new Date().toLocaleTimeString('it-IT').slice(0, 5);

    try {
      await createReserva({
        usuario_id: user.id_registro,
        fecha: fechaActual,
        hora: horaActual,
        numero_personas: 1, // Por defecto 1
        estado: "Pendiente"
      });
      alert(`✅ Reserva para ${tourTitle} enviada correctamente`);
    } catch (error) {
      console.error(error);
      alert("❌ Error al crear reserva");
    }
  };

  return (
    <div className="reservas-container">
      {tours.map((tour) => (
        <div key={tour.id} className="tour-item">
          <img src={tour.img} alt={tour.title} className="tour-img" />
          <div className="tour-content">
            <h3 className="tour-title">{tour.title}</h3>
            <ul className="tour-description">
              {tour.description.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <button 
              className="btn-reservar"
              onClick={() => handleReservar(tour.title)}
            >
              Reservar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default reservas;



