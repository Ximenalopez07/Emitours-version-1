import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./pagina/NavBar";
import PaginaInicio from "./pagina/PaginaInicio";
import Lugares from "./pagina/lugares";
import Reservas from "./pagina/reservas";
import Contacto from "./pagina/Contacto";
import InicioSeccion from "./pagina/InicioSeccion";
import Guias from "./pagina/Guias";
import Barra from "./pagina/Barra";

// MODULOS DEL PANEL DE ADMINISTRACIÓN
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminLogin from "./admin/AdminLogin";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminUsuarios from "./admin/AdminUsuarios";
import AdminAdministradores from "./admin/AdminAdministradores";
import AdminLugares from "./admin/AdminLugares";
import AdminCategorias from "./admin/AdminCategorias";
import AdminReservas from "./admin/AdminReservas";
import AdminPagos from "./admin/AdminPagos";
import AdminComentarios from "./admin/AdminComentarios";
import AdminPromociones from "./admin/AdminPromociones";
import AdminReportes from "./admin/AdminReportes";
import AdminConfiguracion from "./admin/AdminConfiguracion";
import AdminPerfil from "./admin/AdminPerfil";

function MainApp() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdminRoute && <NavBar />}

      <div className={isAdminRoute ? "" : "content"}>
        <Routes>
          {/* Rutas Públicas de Usuario */}
          <Route path="/" element={<PaginaInicio />} />
          <Route path="/lugares" element={<Lugares />} />
          <Route path="/guias" element={<Guias />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/Contacto" element={<Contacto />} />
          <Route path="/inicioseccion" element={<InicioSeccion />} />

          {/* Login de Administrador */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Rutas Protegidas del Panel Administrativo */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/administradores" element={<AdminAdministradores />} />
              <Route path="/admin/lugares" element={<AdminLugares />} />
              <Route path="/admin/categorias" element={<AdminCategorias />} />
              <Route path="/admin/reservas" element={<AdminReservas />} />
              <Route path="/admin/pagos" element={<AdminPagos />} />
              <Route path="/admin/comentarios" element={<AdminComentarios />} />
              <Route path="/admin/promociones" element={<AdminPromociones />} />
              <Route path="/admin/reportes" element={<AdminReportes />} />
              <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
              <Route path="/admin/perfil" element={<AdminPerfil />} />
            </Route>
          </Route>
        </Routes>
      </div>

      {!isAdminRoute && <Barra />}
    </div>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

export default App;
