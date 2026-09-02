import React, { useEffect, useState, useContext } from "react";
import { getLugares } from "../api";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { FaMapMarkerAlt } from "react-icons/fa";
import "./lugares.css";

export default function Lugares() {
  const { language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  const [listaLugares, setListaLugares] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLugares()
      .then((res) => {
        setListaLugares(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar los lugares:", err);
        setError("No se pudieron cargar los lugares turísticos.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="lugares-page-container">
        <div className="lugares-content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando lugares...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lugares-page-container">
        <div className="lugares-content">
          <div className="alert alert-danger my-4 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lugares-page-container">
      <div className="lugares-content">
        {/* Encabezado igual a Guías */}
        <div className="lugares-header">
          <h1 className="lugares-title">
            <FaMapMarkerAlt className="lugares-title-icon" /> {t.lugares}
          </h1>
          <p className="lugares-subtitle">
            {language === 'en' ? 'Explore the iconic places and tours in Medellín and Antioquia.' : 'Conoce los lugares y tours emblemáticos de Medellín y Antioquia.'}
          </p>
        </div>

        {/* Lista de tarjetas de lugares (únicamente foto, título y descripción encerrados en su cuadrito) */}
        <div className="lugares-list">
          {listaLugares.map((lugar) => (
            <div key={lugar.id} className="lugar-card">
              <div className="lugar-photo-container">
                <img
                  src={lugar.imagen || lugar.img || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300"}
                  alt={lugar.nombre}
                  className="lugar-photo"
                />
              </div>

              <div className="lugar-info">
                <h3 className="lugar-name">{lugar.nombre}</h3>
                <p className="lugar-description">{lugar.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
