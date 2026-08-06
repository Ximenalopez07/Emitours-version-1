import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import ProfileDrawer from "./ProfileDrawer";
import "bootstrap/dist/css/bootstrap.min.css";
import "./NavBar.css";
import logo from "../assets/logo.jpg"; // <-- tu logo

function NavBar() {
  const { user, language } = useContext(UIContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const t = translations[language];

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
                      src={user.foto || "https://www.w3schools.com/howto/img_avatar.png"} 
                      alt="Perfil" 
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