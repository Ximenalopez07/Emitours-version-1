import React, { useEffect, useState } from 'react';
import { getAdminAdministradores, createAdminAdministrador, updateAdminAdministrador, deleteAdminAdministrador } from '../api';
import { FaUserPlus, FaEdit, FaTrash, FaShieldAlt, FaKey } from 'react-icons/fa';

export default function AdminAdministradores() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', documento: '', correo: '', contrasena: '', telefono: '', rol: 'Administrador', estado: 'Activo'
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = () => {
    getAdminAdministradores()
      .then((res) => setAdmins(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        await updateAdminAdministrador(editingAdmin.id, formData);
      } else {
        await createAdminAdministrador(formData);
      }
      setShowModal(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.mensaje || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro de que deseas eliminar este administrador?")) {
      await deleteAdminAdministrador(id);
      fetchAdmins();
    }
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Gestión de Administradores</h2>
          <p>Control de acceso de personal administrativo del sistema</p>
        </div>
        <button className="btn-save" onClick={() => {
          setEditingAdmin(null);
          setFormData({ nombre: '', apellido: '', documento: '', correo: '', contrasena: '', telefono: '', rol: 'Administrador', estado: 'Activo' });
          setShowModal(true);
        }}>
          <FaUserPlus /> Crear Administrador
        </button>
      </div>

      {loading ? (
        <div className="loading-text">Cargando administradores...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td><strong>{a.nombre} {a.apellido}</strong></td>
                  <td>{a.correo}</td>
                  <td>{a.telefono || 'N/A'}</td>
                  <td><span style={{ color: a.rol === 'Super Administrador' ? '#ec4899' : '#3b82f6', fontWeight: 600 }}>{a.rol}</span></td>
                  <td><span className={`badge-status ${a.estado === 'Activo' ? 'active' : 'inactive'}`}>{a.estado}</span></td>
                  <td>
                    <button className="action-btn edit me-2" onClick={() => {
                      setEditingAdmin(a);
                      setFormData({ ...a, contrasena: '' });
                      setShowModal(true);
                    }}>
                      <FaEdit />
                    </button>
                    {a.rol !== 'Super Administrador' && (
                      <button className="action-btn delete" onClick={() => handleDelete(a.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>{editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input type="text" required value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input type="email" required value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Contraseña {editingAdmin && '(Dejar en blanco para mantener la actual)'}</label>
                <input type="password" required={!editingAdmin} value={formData.contrasena} onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}>
                  <option value="Administrador">Administrador</option>
                  <option value="Super Administrador">Super Administrador</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
