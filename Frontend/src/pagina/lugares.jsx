import React, { useEffect, useState, useContext } from "react";
import { getLugares } from "../api";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { FaMapMarkerAlt } from "react-icons/fa";
import { resolveLugarPhoto } from "../utils/assetHelper";
import { obtenerConfigTour } from "./reservas";
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
        setError(language === 'en' ? 'Could not load tourist places.' : 'No se pudieron cargar los lugares turísticos.');
        setLoading(false);
      });
  }, [language]);

  if (loading) {
    return (
      <div className="lugares-page-container">
        <div className="lugares-content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{language === 'en' ? 'Loading...' : 'Cargando...'}</span>
            </div>
            <p className="mt-2 text-muted">{language === 'en' ? 'Loading places...' : 'Cargando lugares...'}</p>
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
          {listaLugares.map((lugar) => {
            const config = obtenerConfigTour(lugar.nombre);
            const lugarNorm = (lugar.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const descTraducida = t.places_desc && (
              t.places_desc[lugar.nombre] ||
              Object.entries(t.places_desc).find(([k]) => {
                const kNorm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return kNorm === lugarNorm || lugarNorm.includes(kNorm) || kNorm.includes(lugarNorm);
              })?.[1]
            );

            const descripcionMostrada = language === 'en'
              ? (descTraducida || config?.descripcion_en || lugar.descripcion)
              : (lugar.descripcion || descTraducida);

            return (
              <div key={lugar.id} className="lugar-card">
                <div className="lugar-photo-container">
                  <img
                    src={resolveLugarPhoto(lugar.imagen || lugar.img, lugar.nombre)}
                    alt={lugar.nombre}
                    className="lugar-photo"
                  />
                </div>

                <div className="lugar-info">
                  <h3 className="lugar-name">{lugar.nombre}</h3>
                  <p className="lugar-description">{descripcionMostrada}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
