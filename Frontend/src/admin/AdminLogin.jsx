import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { FaShieldAlt, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import './AdminLogin.css';

export default function AdminLogin() {
  const [correo, setCorreo] = useState('admin@emitours.com');
  const [contrasena, setContrasena] = useState('Admin123*');
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(correo, contrasena);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-badge-icon">
            <FaShieldAlt />
          </div>
          <h2>EmiTours Admin</h2>
          <p>Panel de Control y Gestión Administrativa</p>
        </div>

        {error && <div className="admin-alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label>Correo Electrónico</label>
            <div className="admin-input-field">
              <FaEnvelope className="field-icon" />
              <input
                type="email"
                placeholder="admin@emitours.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label>Contraseña</label>
            <div className="admin-input-field">
              <FaLock className="field-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <span>Recordar sesión</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Instrucciones enviadas a tu correo de administrador."); }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? (
              <span>Cargando...</span>
            ) : (
              <>
                <FaSignInAlt className="btn-icon" /> Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>🔐 Acceso restringido únicamente para personal autorizado.</p>
        </div>
      </div>
    </div>
  );
}
