import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminAdministradores, createAdminAdministrador, updateAdminAdministrador, deleteAdminAdministrador } from '../api';
import {
  FaUserPlus,
  FaEdit,
  FaTrashAlt,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserShield,
  FaSearch
} from 'react-icons/fa';
import './AdminUsuarios.css';

export default function AdminAdministradores() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    correo: '',
    contrasena: '',
    telefono: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  const fetchAdmins = () => {
    setLoading(true);
    getAdminAdministradores()
      .then((res) => setAdmins(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setFormData({
      nombre: '',
      apellido: '',
      documento: '',
      correo: '',
      contrasena: '',
      telefono: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      nombre: admin.nombre || '',
      apellido: admin.apellido || '',
      documento: admin.documento || '',
      correo: admin.correo || '',
      contrasena: '',
      telefono: admin.telefono || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        await updateAdminAdministrador(editingAdmin.id, formData);
        showNotify('✅ Administrador actualizado exitosamente');
      } else {
        await createAdminAdministrador(formData);
        showNotify('✅ Nuevo administrador creado exitosamente con rol admin');
      }
      setShowModal(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.mensaje || err.message || 'Error al procesar la solicitud');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;
    try {
      await deleteAdminAdministrador(adminToDelete.id);
      showNotify('✅ Administrador removido exitosamente');
      setAdminToDelete(null);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.mensaje || err.message || 'Error al eliminar administrador');
      setAdminToDelete(null);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = search.toLowerCase();
    const fullName = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (a.correo || '').toLowerCase().includes(q) ||
      String(a.id || '').includes(q)
    );
  });

  return (
    <div className="admin-page-view">
      {/* CABECERA */}
      <div className="page-title-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/admin/configuracion" style={{ color: '#0284c7', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
              <FaArrowLeft /> Configuración
            </Link>
          </div>
          <h2 className="page-heading">Gestión de Administradores</h2>
          <p className="page-subheading">
            Personal autorizado con rol administrativo único (admin) en EmiTours
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary-action" onClick={handleOpenCreate}>
            <FaUserPlus /> Nuevo Administrador
          </button>
        </div>
      </div>

      {/* NOTIFICACIÓN */}
      {notification && (
        <div className="admin-alert-banner">
          <FaCheckCircle /> {notification}
        </div>
      )}

      {/* BARRA DE HERRAMIENTAS / BÚSQUEDA */}
      <div className="admin-toolbar-row">
        <div className="admin-search-box">
          <FaSearch className="search-box-icon" />
          <input
            type="text"
            placeholder="Buscar administrador por nombre, correo o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA DE ADMINISTRADORES */}
      {loading ? (
        <div className="table-loading-spinner">Cargando personal administrativo...</div>
      ) : (
        <div className="admin-card-table-wrapper">
          <table className="admin-modern-table">
            <thead>
              <tr>
                <th>Administrador</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Rol Unificado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-notice">
                    No se encontraron administradores registrados.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="user-cell-info">
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '15px'
                        }}>
                          {(a.nombre || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="user-cell-name">{a.nombre} {a.apellido}</span>
                          <span className="user-cell-id">ID: #{a.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-email-text">{a.correo}</span>
                    </td>
                    <td>{a.telefono || 'No registrado'}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                        border: '1px solid #bae6fd'
                      }}>
                        <FaUserShield /> Administrador
                      </span>
                    </td>
                    <td>
                      <span className="table-doc-tag" style={{ color: '#16a34a', borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
                        {a.estado || 'Activo'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-group">
                        <button
                          className="table-btn-action edit"
                          onClick={() => handleOpenEdit(a)}
                          title="Editar Administrador"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="table-btn-action delete"
                          onClick={() => setAdminToDelete(a)}
                          title="Remover Administrador"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR / EDITAR ADMINISTRADOR */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>{editingAdmin ? `Editar Administrador #${editingAdmin.id}` : 'Registrar Nuevo Administrador'}</h3>
            <p className="modal-subtitle">
              {editingAdmin 
                ? 'Actualiza los datos o credenciales de la cuenta administrativa' 
                : 'La cuenta se registrará exclusivamente con rol de administrador (admin)'}
            </p>

            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Apellido</label>
                  <input
                    type="text"
                    placeholder="Ej: Gómez"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@emitours.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>
                    Contraseña {editingAdmin ? '(Dejar en blanco para conservar actual)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingAdmin}
                    placeholder={editingAdmin ? '••••••••' : 'Mínimo 6 caracteres'}
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 3001234567"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions-end">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-action">
                  {editingAdmin ? 'Guardar Cambios' : 'Crear Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN DE ELIMINACIÓN */}
      {adminToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card confirm-modal-card">
            <div className="confirm-icon-wrapper">
              <FaExclamationTriangle />
            </div>
            <h3 className="confirm-title">¿Remover permisos de este administrador?</h3>
            <p className="confirm-message">
              Estás a punto de remover al administrador <strong>{adminToDelete.nombre} {adminToDelete.apellido}</strong> ({adminToDelete.correo}). Su cuenta perderá acceso al panel de administración.
            </p>
            <div className="confirm-actions-row">
              <button
                className="btn-secondary-action"
                onClick={() => setAdminToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger-action"
                onClick={handleDeleteConfirm}
              >
                Sí, Remover Administrador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
