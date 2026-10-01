import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import {
  FaChartPie,
  FaUsers,
  FaMapMarkedAlt,
  FaUserFriends,
  FaCalendarCheck,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaSearch,
  FaAngleLeft,
  FaAngleRight,
  FaCompass
} from 'react-icons/fa';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, logout } = useContext(AdminAuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Secciones solicitadas del Menú del Administrador
  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FaChartPie /> },
    { path: '/admin/usuarios', label: 'Usuarios', icon: <FaUsers /> },
    { path: '/admin/lugares', label: 'Lugares', icon: <FaMapMarkedAlt /> },
    { path: '/admin/guias', label: 'Guías', icon: <FaUserFriends /> },
    { path: '/admin/reservas', label: 'Reservas', icon: <FaCalendarCheck /> },
    { path: '/admin/configuracion', label: 'Configuración', icon: <FaCog /> },
  ];

  const [searchFocused, setSearchFocused] = useState(false);

  const executeSearch = (targetPath) => {
    if (!searchQuery.trim()) return;
    setSearchFocused(false);
    navigate(`${targetPath}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();

    if (query.includes('reserva') || query.startsWith('res-')) executeSearch('/admin/reservas');
    else if (query.includes('lugar') || query.includes('tour') || query.includes('comuna') || query.includes('pablo')) executeSearch('/admin/lugares');
    else if (query.includes('guia') || query.includes('guía') || query.includes('fabiola') || query.includes('yulisa') || query.includes('mariana') || query.includes('gloria')) executeSearch('/admin/guias');
    else if (query.includes('config')) executeSearch('/admin/configuracion');
    else {
      // Si ya está en una sección, busca en esa sección, si no, busca en reservas o usuarios
      if (location.pathname.startsWith('/admin/reservas')) executeSearch('/admin/reservas');
      else if (location.pathname.startsWith('/admin/lugares')) executeSearch('/admin/lugares');
      else if (location.pathname.startsWith('/admin/guias')) executeSearch('/admin/guias');
      else executeSearch('/admin/usuarios');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <div className={`admin-layout-container ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* SIDEBAR MENÚ LATERAL */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-brand">
            <div className="brand-logo">
              <FaCompass className="brand-compass-icon" />
            </div>
            {!collapsed && (
              <div className="brand-text">
                <span className="brand-title">EmiTours</span>
                <span className="brand-badge">Admin Panel</span>
              </div>
            )}
          </Link>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </button>
        </div>

        <nav className="admin-sidebar-menu">
          <div className="menu-group-label">{!collapsed && "NAVEGACIÓN PRINCIPAL"}</div>
          {menuItems.map((item) => {
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
          <button
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title="Cerrar sesión"
          >
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
            <div className="admin-search-form" style={{ position: 'relative' }}>
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar (Usuarios, Lugares, Guías, Reservas)..."
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGlobalSearch(e);
                  } else if (e.key === 'Escape') {
                    setSearchFocused(false);
                  }
                }}
              />
              {/* DROPDOWN DE BÚSQUEDA GLOBAL RÁPIDA */}
              {searchFocused && searchQuery.trim().length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '100%',
                  background: '#ffffff',
                  borderRadius: '14px',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
                  border: '1px solid #e2e8f0',
                  padding: '8px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Buscar "{searchQuery}" en:
                  </div>

                  <button
                    type="button"
                    onClick={() => executeSearch('/admin/reservas')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FaCalendarCheck style={{ color: '#0284c7' }} />
                    <div>
                      <strong style={{ display: 'block' }}>Reservas</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Por código, cliente o lugar</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeSearch('/admin/guias')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FaUserFriends style={{ color: '#0284c7' }} />
                    <div>
                      <strong style={{ display: 'block' }}>Guías Turísticos</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Por nombre, correo o idiomas</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeSearch('/admin/lugares')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FaMapMarkedAlt style={{ color: '#0284c7' }} />
                    <div>
                      <strong style={{ display: 'block' }}>Lugares Turísticos</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Por destino o descripción</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeSearch('/admin/usuarios')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FaUsers style={{ color: '#0284c7' }} />
                    <div>
                      <strong style={{ display: 'block' }}>Usuarios Registrados</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Por nombre, email o cédula</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="navbar-right">
            {/* PERFIL DEL ADMIN */}
            <div className="admin-user-profile">
              <img
                src={admin?.foto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"}
                alt="Admin Avatar"
                className="user-avatar"
              />
              <div className="user-details">
                <span className="user-name">{admin?.nombre || 'Administrador'}</span>
                <span className="user-role">Panel Administrativo</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA CERRAR SESIÓN */}
      {showLogoutConfirm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px auto'
            }}>
              <FaSignOutAlt />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
              ¿Deseas cerrar tu sesión?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Regresarás a la página de inicio de sesión de EmiTours.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={handleLogout}
              >
                Sí, Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

