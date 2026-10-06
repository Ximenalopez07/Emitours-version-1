import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import ProfileDrawer from "./ProfileDrawer";
import "bootstrap/dist/css/bootstrap.min.css";
import "./NavBar.css";
import logo from "../assets/logo.jpg"; // <-- tu logo

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

function NavBar() {
  const { user, language } = useContext(UIContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const t = translations[language] || translations.es;

  const userAvatar = (user?.picture && typeof user.picture === "string" && user.picture.trim())
    || (user?.foto && typeof user.foto === "string" && user.foto.trim())
    || DEFAULT_AVATAR;

  return (
    <>
      <nav className="navbar navbar-expand-lg custom-navbar fixed-top">
        <div className="container">
          
          {/* LOGO + TEXTO */}
          <Link className="navbar-brand brand-title d-flex align-items-center" to="/">
            <img 
              src={logo} 
              alt="Logo Ruta Tours" 
              className="navbar-logo"
            />
            <span className="ms-2">EmiTours</span>
          </Link>

          <button
            className="navbar-toggler custom-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">

              <li className="nav-item">
                <Link className="nav-link nav-item-link" to="/">{t.inicio}</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link nav-item-link" to="/lugares">{t.lugares}</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link nav-item-link" to="/guias">{t.guias || "Guías"}</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link nav-item-link" to="/reservas">{t.reservas}</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link nav-item-link" to="/contacto">{t.contacto}</Link>
              </li>

              {user ? (
                <li className="nav-item">
                  <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="btn btn-outline-light profile-nav-btn d-flex align-items-center ms-lg-3 mt-2 mt-lg-0"
                    style={{ 
                      borderRadius: "20px", 
                      padding: "6px 14px", 
                      border: "1px solid rgba(255,255,255,0.6)",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "#fff"
                    }}
                  >
                    <img 
                      src={userAvatar} 
                      alt="Perfil" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                      style={{ width: "24px", height: "24px", borderRadius: "50%", marginRight: "8px", objectFit: "cover" }}
                    />
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{user.nombre_usuario}</span>
                  </button>
                </li>
              ) : (
                <li className="nav-item">
                  <Link className="btn btn-light login-btn ms-lg-3 mt-2 mt-lg-0"
                        to="/inicioseccion">
                    {t.iniciar_sesion}
                  </Link>
                </li>
              )}

            </ul>
          </div>
        </div>
      </nav>

      {/* Panel lateral del perfil */}
      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

export default NavBar;