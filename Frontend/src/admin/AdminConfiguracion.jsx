import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminConfiguracion, updateAdminConfiguracion } from '../api';
import { FaSave, FaCheckCircle, FaSlidersH, FaUserShield, FaArrowRight } from 'react-icons/fa';
import './AdminUsuarios.css';

export default function AdminConfiguracion() {
  const [config, setConfig] = useState({
    nombre_sitio: 'EmiTours Medellín',
    correo: 'contacto@emitours.com',
    telefono: '+57 300 123 4567',
    direccion: 'Medellín, Antioquia, Colombia',
    modo_defecto: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getAdminConfiguracion()
      .then((res) => {
        if (res.data && res.data.nombre_sitio) setConfig(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAdminConfiguracion(config);
      setMsg('✅ Configuración del portal guardada exitosamente');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert('Error al guardar configuración');
    }
  };

  return (
    <div className="admin-page-view">
      <div className="page-title-bar">
        <div>
          <h2 className="page-heading">Configuración del Sitio</h2>
          <p className="page-subheading">
            Ajustes generales, datos de contacto oficial y parámetros de EmiTours
          </p>
        </div>
      </div>

      {msg && (
        <div className="admin-alert-banner">
          <FaCheckCircle /> {msg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        {/* TARJETA 1: PARÁMETROS DEL SITIO */}
        <div className="admin-modal-card" style={{ maxWidth: '640px', width: '100%', margin: 0 }}>
          <form onSubmit={handleSubmit} className="admin-modal-form">
            <div className="form-group-field">
              <label>Nombre del Portal Web</label>
              <input
                type="text"
                required
                value={config.nombre_sitio || ''}
                onChange={(e) => setConfig({ ...config, nombre_sitio: e.target.value })}
              />
            </div>

            <div className="form-group-row">
              <div className="form-group-field">
                <label>Correo Oficial de Contacto</label>
                <input
                  type="email"
                  required
                  value={config.correo || ''}
                  onChange={(e) => setConfig({ ...config, correo: e.target.value })}
                />
              </div>

              <div className="form-group-field">
                <label>Teléfono / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={config.telefono || ''}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group-field">
              <label>Dirección Física / Ciudad</label>
              <input
                type="text"
                required
                value={config.direccion || ''}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
              />
            </div>

            <div className="modal-actions-end" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-primary-action" style={{ width: '100%', justifyContent: 'center' }}>
                <FaSave /> Guardar Configuración
              </button>
            </div>
          </form>
        </div>

        {/* TARJETA 2: GESTIÓN DE ADMINISTRADORES */}
        <div className="admin-modal-card" style={{ maxWidth: '640px', width: '100%', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              <FaUserShield />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Gestión de administradores
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Control y administración del personal con acceso de administrador
              </p>
            </div>
          </div>

          <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5', margin: '0 0 18px 0' }}>
            Consulta el equipo administrativo activo, registra nuevos administradores del sistema, actualiza credenciales o remueve cuentas con total seguridad.
          </p>

          <Link
            to="/admin/administradores"
            className="btn-primary-action"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              textDecoration: 'none',
              padding: '12px 22px',
              fontWeight: '700',
              borderRadius: '10px',
              width: '100%'
            }}
          >
            <FaUserShield /> Abrir Gestión de Administradores <FaArrowRight style={{ fontSize: '12px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
