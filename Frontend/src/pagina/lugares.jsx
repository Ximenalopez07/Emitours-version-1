import { useEffect, useState } from "react";
import { getLugares } from "../api";
import "./lugares.css";

export default function lugares() {
  const [listaLugares, setListaLugares] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLugares()
      .then((res) => {
        // En Express, db.query retorna un array directamente en res.data
        setListaLugares(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar los lugares:", err);
        setError("No se pudieron cargar los lugares. Inténtalo de nuevo más tarde.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="lugares-container"><h3 style={{ textAlign: "center", color: "#fff" }}>Cargando lugares...</h3></div>;
  }

  if (error) {
    return <div className="lugares-container"><h3 style={{ textAlign: "center", color: "red" }}>{error}</h3></div>;
  }

  return (
    <div className="lugares-container">
      {listaLugares.map((lugar) => (
        <div key={lugar.id} className="lugar-card">
          <img src={lugar.imagen} alt={lugar.nombre} />
          <div>
            <h2>{lugar.nombre}</h2>
            <p>{lugar.descripcion}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
