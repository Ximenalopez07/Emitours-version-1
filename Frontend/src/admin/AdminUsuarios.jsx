import React, { useEffect, useState } from 'react';
import { getAdminUsuarios, updateAdminUsuario } from '../api';
import { FaFileExcel, FaFilePdf, FaSearch, FaUserCheck, FaUserSlash, FaEdit } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './AdminUsuarios.css';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = () => {
    getAdminUsuarios()
      .then((res) => setUsuarios(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredUsuarios = usuarios.filter((u) =>
    (u.nombre_usuario || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.correo_electronico || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.cedula || '').includes(search)
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUsuarios);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'Usuarios_EmiTours.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Usuarios Registrados - EmiTours', 14, 15);
    const tableData = filteredUsuarios.map(u => [
      u.id_registro,
      u.nombre_usuario,
      u.cedula || 'N/A',
      u.correo_electronico,
      u.telefono || 'N/A',
      u.sexo || 'N/A'
    ]);
    doc.autoTable({
      head: [['ID', 'Usuario', 'Cédula', 'Correo', 'Teléfono', 'Sexo']],
      body: tableData,
      startY: 22
    });
    doc.save('Usuarios_EmiTours.pdf');
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Gestión de Usuarios (Clientes)</h2>
          <p>Administra los clientes registrados en la plataforma</p>
        </div>
        <div className="header-actions">
          <button className="btn-export excel" onClick={exportExcel}>
            <FaFileExcel /> Exportar Excel
          </button>
          <button className="btn-export pdf" onClick={exportPDF}>
            <FaFilePdf /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-bar">
          <FaSearch className="icon" />
          <input
            type="text"
            placeholder="Buscar por usuario, correo o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Cargando usuarios...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>ID</th>
                <th>Nombre Usuario</th>
                <th>Cédula</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Sexo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((u) => (
                <tr key={u.id_registro}>
                  <td>
                    <img
                      src={u.foto || "https://www.w3schools.com/howto/img_avatar.png"}
                      alt="Avatar"
                      className="table-avatar"
                    />
                  </td>
                  <td>#{u.id_registro}</td>
                  <td><strong>{u.nombre_usuario}</strong></td>
                  <td>{u.cedula || 'Sin Cédula'}</td>
                  <td>{u.correo_electronico}</td>
                  <td>{u.telefono || 'N/A'}</td>
                  <td>{u.sexo || 'N/A'}</td>
                  <td>
                    <span className="badge-status active">Activo</span>
                  </td>
                  <td>
                    <button className="action-btn edit" onClick={() => setSelectedUser(u)} title="Editar">
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE USUARIO */}
      {selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Editar Usuario #{selectedUser.id_registro}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateAdminUsuario(selectedUser.id_registro, selectedUser);
              setSelectedUser(null);
              fetchUsuarios();
            }}>
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  value={selectedUser.nombre_usuario || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, nombre_usuario: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={selectedUser.correo_electronico || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, correo_electronico: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={selectedUser.telefono || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, telefono: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setSelectedUser(null)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
