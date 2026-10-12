import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { FaEnvelope, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import './AdminLogin.css';

// Expresión regular para validar formato de correo electrónico
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLogin() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validaciones de Correo Electrónico en Frontend
    if (!correo || correo.length === 0) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    if (/\s/.test(correo)) {
      setError('El correo electrónico no puede contener espacios');
      return;
    }

    if (!EMAIL_REGEX.test(correo) || correo.length > 150) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    // 2. Validaciones de Contraseña en Frontend
    if (!contrasena || contrasena.length === 0) {
      setError('Ingresa tu contraseña');
      return;
    }

    if (/\s/.test(contrasena)) {
      setError('La contraseña no puede contener espacios');
      return;
    }

    setLoading(true);

    try {
      await login(correo, contrasena);
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.message || 'Correo electrónico o contraseña incorrectos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        {/* ENCABEZADO CON LOGO DE EMITOURS */}
        <div className="admin-login-header">
          <div className="admin-logo-container">
            <img src={logo} alt="Logo EmiTours" className="admin-logo-img" />
          </div>
          <h2>ACCESO ADMINISTRADOR</h2>
          <p>Panel de Control y Gestión Administrativa</p>
        </div>

        {/* ALERTA DE ERROR */}
        {error && <div className="admin-alert-danger">{error}</div>}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          {/* CAMPO CORREO ELECTRÓNICO */}
          <div className="admin-input-group">
            <label htmlFor="admin-email">CORREO ELECTRÓNICO</label>
            <div className="admin-input-field">
              <FaEnvelope className="field-icon" />
              <input
                id="admin-email"
                type="email"
                placeholder="ejemplo@emitours.com"
                value={correo}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/\s/.test(val)) {
                    setError('El correo electrónico no puede contener espacios');
                    setCorreo(val.replace(/\s+/g, ''));
                  } else {
                    setCorreo(val);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    setError('El correo electrónico no puede contener espacios');
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (/\s/.test(pasted)) {
                    e.preventDefault();
                    setError('El correo electrónico no puede contener espacios');
                  }
                }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* CAMPO CONTRASEÑA CON BOTÓN MOSTRAR/OCULTAR */}
          <div className="admin-input-group">
            <label htmlFor="admin-password">CONTRASEÑA</label>
            <div className="admin-input-field">
              <FaLock className="field-icon" />
              <input
                id="admin-password"
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/\s/.test(val)) {
                    setError('La contraseña no puede contener espacios');
                    return; // Impedir que el espacio se incorpore al valor del campo
                  }
                  setContrasena(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    setError('La contraseña no puede contener espacios');
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (/\s/.test(pasted)) {
                    e.preventDefault();
                    setError('La contraseña no puede contener espacios');
                  }
                }}
                autoComplete="current-password"
                className="has-toggle"
                required
              />
              <button
                type="button"
                className="field-toggle-btn"
                onClick={() => setMostrarPassword((prev) => !prev)}
                title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
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

          {/* BOTÓN INICIAR SESIÓN */}
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? (
              <span>Cargando...</span>
            ) : (
              <>
                <FaSignInAlt className="btn-icon" /> INICIAR SESIÓN
              </>
            )}
          </button>
        </form>

        {/* ENLACE VOLVER */}
        <div className="admin-back-container">
          <Link to="/" className="admin-back-link">
            <FaArrowLeft /> Volver
          </Link>
        </div>

        <div className="admin-login-footer">
          <p>🔐 Acceso restringido únicamente para personal autorizado.</p>
        </div>
      </div>
    </div>
  );
}
