import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { getAdminNotificaciones } from '../api';
import {
  FaChartPie,
  FaUsers,
  FaUserShield,
  FaMapMarkedAlt,
  FaTags,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaComments,
  FaNewspaper,
  FaPercentage,
  FaFileAlt,
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaSearch,
  FaBell,
  FaSun,
  FaMoon,
  FaAngleLeft,
  FaAngleRight
} from 'react-icons/fa';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, logout } = useContext(AdminAuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getAdminNotificaciones()
      .then((res) => setNotificaciones(res.data || []))
      .catch(() => setNotificaciones([]));
  }, []);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FaChartPie /> },
    { path: '/admin/usuarios', label: 'Usuarios', icon: <FaUsers /> },
    { path: '/admin/administradores', label: 'Administradores', icon: <FaUserShield />, superOnly: true },
    { path: '/admin/lugares', label: 'Lugares Turísticos', icon: <FaMapMarkedAlt /> },
    { path: '/admin/categorias', label: 'Categorías', icon: <FaTags /> },
    { path: '/admin/reservas', label: 'Reservas', icon: <FaCalendarCheck /> },
    { path: '/admin/pagos', label: 'Pagos', icon: <FaMoneyBillWave /> },
    { path: '/admin/comentarios', label: 'Comentarios', icon: <FaComments /> },
    { path: '/admin/promociones', label: 'Promociones', icon: <FaPercentage /> },
    { path: '/admin/reportes', label: 'Reportes', icon: <FaFileAlt /> },
    { path: '/admin/configuracion', label: 'Configuración', icon: <FaCog /> },
    { path: '/admin/perfil', label: 'Perfil', icon: <FaUserCircle /> },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();

    if (query.includes('reserva')) navigate('/admin/reservas');
    else if (query.includes('lugar')) navigate('/admin/lugares');
    else if (query.includes('admin')) navigate('/admin/administradores');
    else if (query.includes('categoria')) navigate('/admin/categorias');
    else navigate('/admin/usuarios');
  };

  return (
    <div className={`admin-layout-container ${theme}-theme ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* SIDEBAR MENÚ LATERAL */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span className="brand-logo">ET</span>
            {!collapsed && <span className="brand-name">EmiTours <small>Admin</small></span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </button>
        </div>

        <nav className="admin-sidebar-menu">
          {menuItems.map((item) => {
            if (item.superOnly && admin?.rol !== 'Super Administrador') return null;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-item ${active ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="menu-icon">{item.icon}</span>
                {!collapsed && <span className="menu-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="logout-btn" onClick={logout} title="Cerrar sesión">
            <FaSignOutAlt />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="admin-main-wrapper">
        {/* NAVBAR SUPERIOR */}
        <header className="admin-navbar">
          <div className="navbar-left">
            <button className="mobile-toggle" onClick={() => setCollapsed(!collapsed)}>
              <FaBars />
            </button>
            <form onSubmit={handleGlobalSearch} className="admin-search-form">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscador global (Usuarios, Reservas, Lugares...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="navbar-right">
            {/* TEMA OSCURO / CLARO */}
            <button className="icon-action-btn" onClick={toggleTheme} title="Cambiar Tema">
              {theme === 'dark' ? <FaSun style={{ color: '#f59e0b' }} /> : <FaMoon />}
            </button>

            {/* NOTIFICACIONES */}
            <div className="notifications-dropdown-wrapper">
              <button
                className="icon-action-btn badge-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notificaciones"
              >
                <FaBell />
                <span className="notification-badge">{notificaciones.length || 3}</span>
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="dropdown-header">
                    <h4>Notificaciones del Sistema</h4>
                    <span className="count-badge">{notificaciones.length || 3} nuevas</span>
                  </div>
                  <div className="notifications-list">
                    <div className="notification-item">
                      <div className="notif-bullet blue"></div>
                      <div>
                        <p className="notif-title">Nueva reserva recibida</p>
                        <span className="notif-time">Hace 5 minutos</span>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notif-bullet green"></div>
                      <div>
                        <p className="notif-title">Nuevo usuario registrado</p>
                        <span className="notif-time">Hace 20 minutos</span>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notif-bullet orange"></div>
                      <div>
                        <p className="notif-title">Pago confirmado PSE</p>
                        <span className="notif-time">Hace 1 hora</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PERFIL DEL ADMIN */}
            <div className="admin-user-profile" onClick={() => navigate('/admin/perfil')}>
              <img
                src={admin?.foto || "https://www.w3schools.com/howto/img_avatar.png"}
                alt="Admin Avatar"
                className="user-avatar"
              />
              <div className="user-details">
                <span className="user-name">{admin?.nombre} {admin?.apellido}</span>
                <span className="user-role">{admin?.rol}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
