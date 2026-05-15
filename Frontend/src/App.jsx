import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./pagina/NavBar";
import PaginaInicio from "./pagina/PaginaInicio";
import Lugares from "./pagina/lugares";
import Reservas from "./pagina/reservas";
import Contacto from "./pagina/Contacto";
import InicioSeccion from "./pagina/InicioSeccion";
import Barra from "./pagina/Barra";   // <-- IMPORTA TU FOOTER

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <NavBar />

        <div className="content">
          <Routes>
            <Route path="/" element={<PaginaInicio />} />
            <Route path="/lugares" element={<Lugares />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/Contacto" element={<Contacto />} />
            <Route path="/inicioseccion" element={<InicioSeccion />} />
          </Routes>
        </div>

        <Barra />  {/* <-- EL FOOTER QUEDA ABAJO */}
      </div>
    </BrowserRouter>
  );
}

export default App;
