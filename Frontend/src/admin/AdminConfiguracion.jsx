import React, { useEffect, useState } from 'react';
import { getAdminConfiguracion, updateAdminConfiguracion } from '../api';
import { FaSave, FaCog } from 'react-icons/fa';

export default function AdminConfiguracion() {
  const [config, setConfig] = useState({
    nombre_sitio: 'EmiTours Medellín',
    correo: 'contacto@emitours.com',
    telefono: '+57 300 123 4567',
    direccion: 'Medellín, Antioquia, Colombia',
    modo_defecto: 'dark'
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
    await updateAdminConfiguracion(config);
    setMsg('✅ Configuración del sitio guardada exitosamente');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Configuración del Sitio</h2>
          <p>Ajustes generales del sistema y plataforma pública</p>
        </div>
      </div>

      {msg && <div className="badge-status active" style={{ padding: '12px', fontSize: '14px', marginBottom: '16px' }}>{msg}</div>}

      <div className="admin-modal-card" style={{ maxWidth: '600px', width: '100%' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Sitio Web</label>
            <input type="text" value={config.nombre_sitio || ''} onChange={(e) => setConfig({ ...config, nombre_sitio: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Correo de Contacto Oficial</label>
            <input type="email" value={config.correo || ''} onChange={(e) => setConfig({ ...config, correo: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Teléfono / WhatsApp de Soporte</label>
            <input type="text" value={config.telefono || ''} onChange={(e) => setConfig({ ...config, telefono: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" value={config.direccion || ''} onChange={(e) => setConfig({ ...config, direccion: e.target.value })} />
          </div>
          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="submit" className="btn-save" style={{ width: '100%', justifyContent: 'center' }}>
              <FaSave /> Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
