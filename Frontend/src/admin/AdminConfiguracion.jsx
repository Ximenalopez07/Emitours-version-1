import React, { useEffect, useState } from 'react';
import { getAdminConfiguracion, updateAdminConfiguracion } from '../api';
import { FaSave, FaCheckCircle, FaSlidersH } from 'react-icons/fa';
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

      <div style={{ display: 'flex', justifyContent: 'center' }}>
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
      </div>
    </div>
  );
}
