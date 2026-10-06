import React, { useEffect, useState } from "react";
import { getGuias } from "../api";
import { FaPhoneAlt, FaEnvelope, FaGlobe, FaUserFriends } from "react-icons/fa";
import { resolveGuiaPhoto } from "../utils/assetHelper";
import { useTranslation } from "../context/UIContext";
import "./Guias.css";

export default function Guias() {
  const { t, language } = useTranslation();
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
        setError(t.guias_error || "No se pudieron cargar los guías turísticos.");
        setLoading(false);
      });
  }, [t.guias_error]);

  const formatIdiomaGuia = (idiomaStr) => {
    if (!idiomaStr) return "";
    if (language === "en") {
      if (idiomaStr.toLowerCase().includes("español") && idiomaStr.toLowerCase().includes("inglés")) {
        return "Spanish & English";
      }
      if (idiomaStr.toLowerCase() === "español") {
        return "Spanish";
      }
      if (idiomaStr.toLowerCase() === "inglés") {
        return "English";
      }
    }
    return idiomaStr;
  };

  if (loading) {
    return (
      <div className="guias-page-container">
        <div className="guias-content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t.cargando || "Cargando..."}</span>
            </div>
            <p className="mt-2 text-muted">{t.guias_cargando || "Cargando guías..."}</p>
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
            <FaUserFriends className="guias-title-icon" /> {t.guias_titulo || "Guías"}
          </h1>
          <p className="guias-subtitle">
            {t.guias_subtitulo || "Conoce a nuestros guías turísticos."}
          </p>
        </div>

        {/* Lista de tarjetas de guías */}
        <div className="guias-list">
          {guias.map((guia) => (
            <div key={guia.id} className="guia-card">
              <div className="guia-photo-container">
                <img
                  src={resolveGuiaPhoto(guia.foto, `${guia.nombre || ''} ${guia.apellido || ''}`)}
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
                  <span>{formatIdiomaGuia(guia.idioma)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
