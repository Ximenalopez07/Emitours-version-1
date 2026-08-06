import React, { useContext, useState } from 'react';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { updateAdminAdministrador } from '../api';
import { FaUserCircle, FaSave, FaLock } from 'react-icons/fa';

export default function AdminPerfil() {
  const { admin } = useContext(AdminAuthContext);
  const [formData, setFormData] = useState({
    nombre: admin?.nombre || '',
    apellido: admin?.apellido || '',
    correo: admin?.correo || '',
    telefono: admin?.telefono || '',
    contrasena: ''
  });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAdminAdministrador(admin.id, formData);
      setMsg('✅ Perfil actualizado correctamente');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Perfil del Administrador</h2>
          <p>Gestiona tu información personal y credenciales de acceso</p>
        </div>
      </div>

      {msg && <div className="badge-status active" style={{ padding: '12px', fontSize: '14px', marginBottom: '16px' }}>{msg}</div>}

      <div className="admin-modal-card" style={{ maxWidth: '520px', width: '100%' }}>
        <div style={{ textCenter: 'center', textAlign: 'center', marginBottom: '20px' }}>
          <img src={admin?.foto || "https://www.w3schools.com/howto/img_avatar.png"} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          <h3 style={{ margin: '10px 0 2px 0' }}>{admin?.nombre} {admin?.apellido}</h3>
          <span style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 600 }}>{admin?.rol}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input type="text" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Cambiar Contraseña (Opcional)</label>
            <input type="password" placeholder="Nueva contraseña..." value={formData.contrasena} onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })} />
          </div>
          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="submit" className="btn-save" style={{ width: '100%', justifyContent: 'center' }}>
              <FaSave /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
