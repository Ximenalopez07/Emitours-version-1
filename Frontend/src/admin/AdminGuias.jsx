import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminGuias, createAdminGuia, updateAdminGuia, deleteAdminGuia } from '../api';
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaUserFriends,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaFilePdf
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resolveGuiaPhoto } from '../utils/assetHelper';
import './AdminUsuarios.css';

export default function AdminGuias() {
  const [searchParams] = useSearchParams();
  const [guias, setGuias] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingGuia, setEditingGuia] = useState(null);
  const [guiaToDelete, setGuiaToDelete] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');

  // Estructura exacta de la tabla guias:
  // id, nombre, apellido, telefono, correo, idioma, foto
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    idioma: 'Español',
    foto: ''
  });

  useEffect(() => {
    fetchGuias();
  }, []);

  const fetchGuias = () => {
    setLoading(true);
    getAdminGuias()
      .then((res) => setGuias(res.data || []))
      .catch((err) => console.error("Error al cargar guías:", err))
      .finally(() => setLoading(false));
  };

  const showNotification = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  const filteredGuias = guias.filter((g) => {
    const q = search.toLowerCase();
    const fullName = `${g.nombre || ''} ${g.apellido || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (g.correo || '').toLowerCase().includes(q) ||
      (g.idioma || '').toLowerCase().includes(q) ||
      (g.telefono || '').includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingGuia(null);
    setFormData({
      nombre: '',
      apellido: '',
      telefono: '',
      correo: '',
      idioma: 'Español',
      foto: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (guia) => {
    setEditingGuia(guia);
    setFormData({
      nombre: guia.nombre || '',
      apellido: guia.apellido || '',
      telefono: guia.telefono || '',
      correo: guia.correo || '',
      idioma: guia.idioma || 'Español',
      foto: guia.foto || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingGuia) {
        await updateAdminGuia(editingGuia.id, formData);
        showNotification('✅ Guía turístico actualizado exitosamente');
      } else {
        await createAdminGuia(formData);
        showNotification('✅ Nuevo guía registrado exitosamente');
      }
      setShowModal(false);
      setEditingGuia(null);
      fetchGuias();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar el guía');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!guiaToDelete) return;
    try {
      await deleteAdminGuia(guiaToDelete.id);
      setGuiaToDelete(null);
      fetchGuias();
      showNotification('✅ Guía turístico eliminado exitosamente');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al eliminar el guía');
      setGuiaToDelete(null);
    }
  };

  // EXPORTAR EXCEL
  const exportExcel = () => {
    const dataToExport = filteredGuias.map((g) => ({
      'ID': g.id,
      'Nombre': g.nombre,
      'Apellido': g.apellido,
      'Teléfono': g.telefono || 'Sin teléfono',
      'Correo Electrónico': g.correo,
      'Idiomas': g.idioma || 'Español',
      'Fotografía': g.foto || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guias');
    XLSX.writeFile(wb, 'Guias_Turisticos_EmiTours.xlsx');
  };

  // EXPORTAR PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(2, 132, 199);
    doc.text('EmiTours - Equipo de Guías Turísticos', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el: ${new Date().toLocaleString()} | Total: ${filteredGuias.length} guías`, 14, 22);

    const tableData = filteredGuias.map((g) => [
      `#${g.id}`,
      `${g.nombre} ${g.apellido || ''}`.trim(),
      g.telefono || 'N/A',
      g.correo || 'N/A',
      g.idioma || 'Español',
      g.foto ? (g.foto.startsWith('http') ? 'Enlace Web' : 'Foto Perfil') : 'Sin foto'
    ]);

    const tableConfig = {
      head: [['ID', 'Guía Turístico', 'Teléfono', 'Correo Electrónico', 'Idiomas', 'Referencia Foto']],
      body: tableData,
      startY: 28,
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    };

    if (typeof doc.autoTable === 'function') {
      doc.autoTable(tableConfig);
    } else {
      autoTable(doc, tableConfig);
    }

    doc.save('Guias_Turisticos_EmiTours.pdf');
  };

  return (
    <div className="admin-page-view">
      {/* HEADER DE LA PÁGINA */}
      <div className="page-title-bar">
        <div>
          <h2 className="page-heading">Gestión de Guías Turísticos</h2>
          <p className="page-subheading">
            Administra el equipo de guías profesionales y asignación de tours de EmiTours
          </p>
        </div>
        <div className="header-action-buttons">
          <button className="btn-export-file excel" onClick={exportExcel} title="Exportar a Excel">
            <FaFileExcel /> Exportar Excel
          </button>
          <button className="btn-export-file pdf" onClick={exportPDF} title="Exportar a PDF">
            <FaFilePdf /> Exportar PDF
          </button>
          <button className="btn-primary-action" onClick={handleOpenCreate}>
            <FaPlus /> Agregar Nuevo Guía
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="admin-alert-banner">
          <FaCheckCircle /> {alertMsg}
        </div>
      )}

      {/* BARRA DE FILTRO Y BÚSQUEDA */}
      <div className="table-filter-bar">
        <div className="filter-search-box">
          <FaSearch className="search-box-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, correo o idioma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-count-badge">
          Total: <strong>{filteredGuias.length}</strong> guías
        </div>
      </div>

      {/* TABLA DE GUÍAS */}
      {loading ? (
        <div className="admin-table-loading">
          <div className="dashboard-spinner"></div>
          <p>Cargando guías turísticos...</p>
        </div>
      ) : (
        <div className="admin-card-table-wrapper">
          <table className="admin-modern-table">
            <thead>
              <tr>
                <th>Guía Turístico</th>
                <th>Teléfono</th>
                <th>Correo Electrónico</th>
                <th>Idiomas que domina</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuias.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty-notice">
                    No se encontraron guías turísticos registrados.
                  </td>
                </tr>
              ) : (
                filteredGuias.map((g) => {
                  const resolvedImg = resolveGuiaPhoto(g.foto, `${g.nombre} ${g.apellido}`);
                  return (
                    <tr key={g.id}>
                      <td>
                        <div className="user-cell-info">
                          <img
                            src={resolvedImg}
                            alt={`${g.nombre} ${g.apellido}`}
                            className="table-avatar-img"
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #38bdf8'
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200';
                            }}
                          />
                          <div>
                            <span className="user-cell-name">{g.nombre} {g.apellido}</span>
                            <span className="user-cell-id">ID #{g.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                          <FaPhoneAlt style={{ color: '#0284c7', fontSize: '12px' }} />
                          <span>{g.telefono || 'Sin teléfono'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7' }}>
                          <FaEnvelope style={{ color: '#64748b', fontSize: '12px' }} />
                          <span style={{ fontWeight: '500' }}>{g.correo}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          backgroundColor: (g.idioma || '').toLowerCase().includes('ingl') ? '#e0f2fe' : '#f0fdf4',
                          color: (g.idioma || '').toLowerCase().includes('ingl') ? '#0284c7' : '#166534',
                          border: `1px solid ${(g.idioma || '').toLowerCase().includes('ingl') ? '#bae6fd' : '#bbf7d0'}`
                        }}>
                          <FaGlobe /> {g.idioma || 'Español'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            className="table-btn-action edit"
                            onClick={() => handleOpenEdit(g)}
                            title="Editar Guía"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="table-btn-action delete"
                            onClick={() => setGuiaToDelete(g)}
                            title="Eliminar Guía"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR / EDITAR GUÍA */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>{editingGuia ? `Editar Guía: ${editingGuia.nombre} ${editingGuia.apellido}` : 'Registrar Nuevo Guía Turístico'}</h3>
            <p className="modal-subtitle">
              Los datos se actualizarán en la base de datos de EmiTours
            </p>

            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Maria"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Fabiola"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Teléfono *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 3246362543"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="guia@emitours.com"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Idioma(s) que Domina *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Español, Inglés"
                  value={formData.idioma}
                  onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
                />
              </div>

              <div className="form-group-field">
                <label>Ruta o Enlace de la Fotografía</label>
                <input
                  type="text"
                  placeholder="src/assets/fabiola.jpg o https://..."
                  value={formData.foto}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                />
              </div>

              {/* VISTA PREVIA DE LA FOTO */}
              <div style={{
                padding: '14px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <img
                  src={resolveGuiaPhoto(formData.foto, `${formData.nombre} ${formData.apellido}`)}
                  alt="Vista previa"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #0284c7'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200';
                  }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: '#0f172a' }}>
                    Vista Previa de la Fotografía
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {formData.foto ? formData.foto : 'Usando imagen predeterminada o asociada'}
                  </span>
                </div>
              </div>

              <div className="modal-actions-end" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-action">
                  {editingGuia ? 'Guardar Cambios' : 'Registrar Guía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR GUÍA */}
      {guiaToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card confirm-modal-card">
            <div className="confirm-icon-wrapper">
              <FaExclamationTriangle />
            </div>
            <h3 className="confirm-title">¿Eliminar este guía turístico?</h3>
            <p className="confirm-message">
              ¿Estás seguro de que deseas eliminar a <strong>{guiaToDelete.nombre} {guiaToDelete.apellido}</strong> ({guiaToDelete.correo})? Esta acción no se puede deshacer.
            </p>
            <div className="confirm-actions-row">
              <button
                className="btn-secondary-action"
                onClick={() => setGuiaToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger-action"
                onClick={handleDeleteConfirm}
              >
                Sí, Eliminar Guía
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
