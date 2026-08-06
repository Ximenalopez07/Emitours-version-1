import React, { useEffect, useState } from "react";
import { getGuias } from "../api";
import { FaPhoneAlt, FaEnvelope, FaGlobe, FaUserFriends } from "react-icons/fa";
import fabiolaImg from "../assets/fabiola.jpg";
import "./Guias.css";

export default function Guias() {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGuias()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setGuias(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setGuias(res.data.data);
        } else {
          setGuias([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener los guías:", err);
        setError("No se pudieron cargar los guías turísticos.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="guias-page-container">
        <div className="guias-content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando guías...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guias-page-container">
        <div className="guias-content">
          <div className="alert alert-danger my-4 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="guias-page-container">
      <div className="guias-content">
        {/* Encabezado exacto a la imagen */}
        <div className="guias-header">
          <h1 className="guias-title">
            <FaUserFriends className="guias-title-icon" /> Guías
          </h1>
          <p className="guias-subtitle">
            Conoce a nuestros guías turísticos.
          </p>
        </div>

        {/* Lista de tarjetas de guías */}
        <div className="guias-list">
          {guias.map((guia) => (
            <div key={guia.id} className="guia-card">
              <div className="guia-photo-container">
                <img
                  src={
                    guia.nombre && guia.nombre.includes("Fabiola") || guia.apellido && guia.apellido.includes("Fabiola")
                      ? fabiolaImg
                      : (guia.foto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300")
                  }
                  alt={`${guia.nombre} ${guia.apellido}`}
                  className="guia-photo"
                />
              </div>

              <div className="guia-info">
                <h3 className="guia-name">
                  {guia.nombre} {guia.apellido}
                </h3>

                <div className="guia-detail-item">
                  <FaPhoneAlt className="guia-icon" />
                  <span>{guia.telefono}</span>
                </div>

                <div className="guia-detail-item">
                  <FaEnvelope className="guia-icon" />
                  <span>{guia.correo}</span>
                </div>

                <div className="guia-detail-item">
                  <FaGlobe className="guia-icon" />
                  <span>{guia.idioma}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
