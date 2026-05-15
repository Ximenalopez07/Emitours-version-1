import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./NavBar.css";
import logo from "../assets/logo.jpg"; // <-- tu logo

function NavBar() {
  return (
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
          <ul className="navbar-nav ms-auto">

            <li className="nav-item">
              <Link className="nav-link nav-item-link" to="/">Inicio</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link nav-item-link" to="/lugares">Lugares</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link nav-item-link" to="/reservas">Reservas</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link nav-item-link" to="/contacto">Contacto</Link>
            </li>

            <li className="nav-item">
              <Link className="btn btn-light login-btn ms-3"
                    to="/inicioseccion">
                Iniciar Sesión
              </Link>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;