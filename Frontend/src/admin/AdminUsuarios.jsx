import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminUsuarios, createAdminUsuario, updateAdminUsuario, deleteAdminUsuario } from '../api';
import {
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaUserCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resolveUserPhoto, DEFAULT_USER_AVATAR } from '../utils/assetHelper';
import './AdminUsuarios.css';

export default function AdminUsuarios() {
  const [searchParams] = useSearchParams();
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    nombre_usuario: '',
    correo_electronico: '',
    tipo_documento: 'Cédula de ciudadanía',
    cedula: '',
    pais: 'Colombia',
    telefono: '',
    edad: 18,
    contrasena: ''
  });
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');

  const handleOpenCreate = () => {
    setCreateFormData({
      nombre_usuario: '',
      correo_electronico: '',
      tipo_documento: 'Cédula de ciudadanía',
      cedula: '',
      pais: 'Colombia',
      telefono: '',
      edad: 18,
      contrasena: ''
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createAdminUsuario(createFormData);
      showNotification(res.data?.mensaje || '✅ Usuario registrado exitosamente');
      setShowCreateModal(false);
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al registrar el usuario');
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = () => {
    setLoading(true);
    getAdminUsuarios()
      .then((res) => setUsuarios(res.data || []))
      .catch((err) => console.error("Error al cargar usuarios:", err))
      .finally(() => setLoading(false));
  };

  const showNotification = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.nombre_usuario || '').toLowerCase().includes(q) ||
      (u.correo_electronico || '').toLowerCase().includes(q) ||
      (u.cedula || '').includes(q) ||
      (u.telefono || '').includes(q)
    );
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateAdminUsuario(editingUser.id_registro, editingUser);
      setEditingUser(null);
      fetchUsuarios();
      showNotification('✅ Usuario actualizado exitosamente');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al actualizar usuario');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await deleteAdminUsuario(userToDelete.id_registro);
      setUserToDelete(null);
      fetchUsuarios();
      showNotification('✅ Usuario eliminado correctamente de la base de datos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al eliminar usuario');
      setUserToDelete(null);
    }
  };

  const exportExcel = () => {
    const dataToExport = filteredUsuarios.map(u => ({
      ID: u.id_registro,
      Nombre: u.nombre_usuario,
      Documento: u.cedula || 'N/A',
      Correo: u.correo_electronico,
      Teléfono: u.telefono || 'N/A',
      Edad: u.edad || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'Usuarios_EmiTours.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(2, 132, 199);
    doc.text('EmiTours - Listado de Clientes Registrados', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el: ${new Date().toLocaleString()} | Total: ${filteredUsuarios.length} usuarios`, 14, 22);

    const tableData = filteredUsuarios.map(u => [
      `#${u.id_registro}`,
      u.nombre_usuario || 'Sin nombre',
      u.cedula || 'N/A',
      u.correo_electronico || 'N/A',
      u.telefono || 'N/A',
      u.edad ? `${u.edad} años` : 'N/A'
    ]);

    const tableConfig = {
      head: [['ID', 'Usuario', 'Documento', 'Correo Electrónico', 'Teléfono', 'Edad']],
      body: tableData,
      startY: 28,
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 38 },
        2: { cellWidth: 28 },
        3: { cellWidth: 50 },
        4: { cellWidth: 30 },
        5: { cellWidth: 22 }
      }
    };

    if (typeof doc.autoTable === 'function') {
      doc.autoTable(tableConfig);
    } else {
      autoTable(doc, tableConfig);
    }

    doc.save('Usuarios_EmiTours.pdf');
  };

  return (
    <div className="admin-page-view">
      {/* HEADER DE LA PÁGINA */}
      <div className="page-title-bar">
        <div>
          <h2 className="page-heading">Gestión de Usuarios</h2>
          <p className="page-subheading">
            Administración completa de clientes registrados en EmiTours
          </p>
        </div>
        <div className="header-action-buttons">
          <button className="btn-export-file excel" onClick={exportExcel}>
            <FaFileExcel /> Exportar Excel
          </button>
          <button className="btn-export-file pdf" onClick={exportPDF}>
            <FaFilePdf /> Exportar PDF
          </button>
          <button className="btn-primary-action" onClick={handleOpenCreate}>
            <FaPlus /> Nuevo Usuario
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="admin-alert-banner">
          <FaCheckCircle /> {alertMsg}
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y TOTAL */}
      <div className="table-filter-bar">
        <div className="filter-search-box">
          <FaSearch className="search-box-icon" />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, correo, cédula o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-count-badge">
          Total: <strong>{filteredUsuarios.length}</strong> usuarios
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      {loading ? (
        <div className="admin-table-loading">
          <div className="dashboard-spinner"></div>
          <p>Cargando lista de usuarios...</p>
        </div>
      ) : (
        <div className="admin-card-table-wrapper">
          <table className="admin-modern-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Cédula / Documento</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Edad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-notice">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u) => (
                  <tr key={u.id_registro}>
                    <td>
                      <div className="user-cell-info">
                        <img
                          src={resolveUserPhoto(u.foto, u.nombre_usuario)}
                          alt={u.nombre_usuario || "Avatar"}
                          className="table-avatar-img"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_USER_AVATAR;
                          }}
                        />
                        <div>
                          <span className="user-cell-name">{u.nombre_usuario}</span>
                          <span className="user-cell-id">ID: #{u.id_registro}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-doc-tag">{u.cedula || 'Sin cédula'}</span>
                    </td>
                    <td>
                      <span className="table-email-text">{u.correo_electronico}</span>
                    </td>
                    <td>{u.telefono || 'No registrado'}</td>
                    <td>
                      <span className="table-demographics">
                        {u.edad ? `${u.edad} años` : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-group">
                        <button
                          className="table-btn-action view"
                          onClick={() => setSelectedUserDetail(u)}
                          title="Ver Información Completa"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="table-btn-action edit"
                          onClick={() => setEditingUser({ ...u })}
                          title="Editar Información"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="table-btn-action delete"
                          onClick={() => setUserToDelete(u)}
                          title="Eliminar Usuario"
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

      {/* MODAL 1: VER INFORMACIÓN COMPLETA DEL USUARIO */}
      {selectedUserDetail && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card user-detail-card">
            <div className="detail-modal-header">
              <div className="detail-avatar-container">
                <img
                  src={resolveUserPhoto(selectedUserDetail.foto, selectedUserDetail.nombre_usuario)}
                  alt={selectedUserDetail.nombre_usuario || "Avatar"}
                  className="detail-avatar-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_USER_AVATAR;
                  }}
                />
              </div>
              <div className="detail-title-info">
                <h3>{selectedUserDetail.nombre_usuario}</h3>
                <span className="detail-badge-id">Cliente #{selectedUserDetail.id_registro}</span>
              </div>
            </div>

            <div className="detail-grid-data">
              <div className="detail-field">
                <label>Tipo de Documento</label>
                <p>{selectedUserDetail.tipo_documento || 'Cédula de ciudadanía'}</p>
              </div>
              <div className="detail-field">
                <label>Número de Documento</label>
                <p>{selectedUserDetail.cedula || 'No especificado'}</p>
              </div>
              <div className="detail-field">
                <label>País de Origen</label>
                <p>{selectedUserDetail.pais || 'Colombia'}</p>
              </div>
              <div className="detail-field">
                <label>Correo Electrónico</label>
                <p>{selectedUserDetail.correo_electronico}</p>
              </div>
              <div className="detail-field">
                <label>Teléfono</label>
                <p>{selectedUserDetail.telefono || 'No registrado'}</p>
              </div>
              <div className="detail-field">
                <label>Edad</label>
                <p>{selectedUserDetail.edad ? `${selectedUserDetail.edad} años` : 'No registrada'}</p>
              </div>
              <div className="detail-field">
                <label>Rol en Plataforma</label>
                <p className="text-primary font-bold">{selectedUserDetail.rol || 'Cliente'}</p>
              </div>
            </div>

            <div className="modal-actions-end">
              <button
                className="btn-secondary-action"
                onClick={() => setSelectedUserDetail(null)}
              >
                Cerrar
              </button>
              <button
                className="btn-primary-action"
                onClick={() => {
                  setEditingUser({ ...selectedUserDetail });
                  setSelectedUserDetail(null);
                }}
              >
                <FaEdit /> Editar Información
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR INFORMACIÓN PERMITIDA */}
      {editingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Editar Usuario #{editingUser.id_registro}</h3>
            <p className="modal-subtitle">Modifica los datos personales y de contacto del cliente</p>

            <form onSubmit={handleUpdate} className="admin-modal-form">
              <div className="form-group-field">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editingUser.nombre_usuario || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre_usuario: e.target.value })}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Tipo de Documento</label>
                  <select
                    value={editingUser.tipo_documento || 'Cédula de ciudadanía'}
                    onChange={(e) => setEditingUser({ ...editingUser, tipo_documento: e.target.value })}
                  >
                    <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
                    <option value="Cédula de extranjería">Cédula de extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className="form-group-field">
                  <label>Número de Documento</label>
                  <input
                    type="text"
                    required
                    value={editingUser.cedula || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cedula: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>País</label>
                  <input
                    type="text"
                    value={editingUser.pais || 'Colombia'}
                    onChange={(e) => setEditingUser({ ...editingUser, pais: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={editingUser.telefono || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={editingUser.correo_electronico || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, correo_electronico: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Edad</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editingUser.edad || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, edad: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions-end">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setEditingUser(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-action">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN */}
      {userToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card confirm-modal-card">
            <div className="confirm-icon-wrapper">
              <FaExclamationTriangle />
            </div>
            <h3 className="confirm-title">¿Eliminar a este usuario?</h3>
            <p className="confirm-message">
              Estás a punto de eliminar al usuario <strong>{userToDelete.nombre_usuario}</strong> ({userToDelete.correo_electronico}). Esta acción eliminará también sus reservas asociadas en la base de datos de manera definitiva.
            </p>
            <div className="confirm-actions-row">
              <button
                className="btn-secondary-action"
                onClick={() => setUserToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger-action"
                onClick={handleDeleteConfirm}
              >
                Sí, Eliminar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREAR NUEVO USUARIO (ADMINISTRATIVO) */}
      {showCreateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Registrar Nuevo Usuario</h3>
            <p className="modal-subtitle">Ingresa la información personal del nuevo cliente de EmiTours</p>

            <form onSubmit={handleCreateSubmit} className="admin-modal-form">
              <div className="form-group-field">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={createFormData.nombre_usuario}
                  onChange={(e) => setCreateFormData({ ...createFormData, nombre_usuario: e.target.value })}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Tipo de Documento *</label>
                  <select
                    value={createFormData.tipo_documento}
                    onChange={(e) => {
                      const newTipo = e.target.value;
                      let sanitizedCed = createFormData.cedula;
                      if (newTipo === 'Pasaporte') {
                        sanitizedCed = sanitizedCed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
                      } else {
                        sanitizedCed = sanitizedCed.replace(/\D/g, '').slice(0, newTipo === 'Cédula de extranjería' ? 12 : 10);
                      }
                      setCreateFormData({ ...createFormData, tipo_documento: newTipo, cedula: sanitizedCed });
                    }}
                  >
                    <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
                    <option value="Cédula de extranjería">Cédula de extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label>Número de Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder={createFormData.tipo_documento === 'Pasaporte' ? 'Ej: A12345678' : 'Ej: 1087998487'}
                    value={createFormData.cedula}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (createFormData.tipo_documento === 'Pasaporte') {
                        val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
                      } else {
                        val = val.replace(/\D/g, '').slice(0, createFormData.tipo_documento === 'Cédula de extranjería' ? 12 : 10);
                      }
                      setCreateFormData({ ...createFormData, cedula: val });
                    }}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>País</label>
                  <input
                    type="text"
                    placeholder="Colombia"
                    value={createFormData.pais}
                    onChange={(e) => setCreateFormData({ ...createFormData, pais: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    placeholder="+573001234567"
                    value={createFormData.telefono}
                    onChange={(e) => setCreateFormData({ ...createFormData, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="cliente@ejemplo.com"
                    value={createFormData.correo_electronico}
                    onChange={(e) => setCreateFormData({ ...createFormData, correo_electronico: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Edad</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={createFormData.edad}
                    onChange={(e) => setCreateFormData({ ...createFormData, edad: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Contraseña Inicial (Opcional, por defecto: Usuario123*)</label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={createFormData.contrasena}
                  onChange={(e) => setCreateFormData({ ...createFormData, contrasena: e.target.value })}
                />
              </div>

              <div className="modal-actions-end">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-action">
                  <FaPlus /> Registrar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

