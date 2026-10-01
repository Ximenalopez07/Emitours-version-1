import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminLugares, createAdminLugar, updateAdminLugar, deleteAdminLugar } from '../api';
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaImage,
  FaEye,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaFilePdf
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resolveLugarPhoto } from '../utils/assetHelper';
import './AdminUsuarios.css';

export default function AdminLugares() {
  const [searchParams] = useSearchParams();
  const [lugares, setLugares] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [editingLugar, setEditingLugar] = useState(null);
  const [selectedLugarView, setSelectedLugarView] = useState(null);
  const [lugarToDelete, setLugarToDelete] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');

  // Formulario según estructura exacta de la base de datos:
  // id, nombre, descripcion, imagen
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: ''
  });

  useEffect(() => {
    fetchLugares();
  }, []);

  const fetchLugares = () => {
    setLoading(true);
    getAdminLugares()
      .then((res) => setLugares(res.data || []))
      .catch((err) => console.error("Error al cargar lugares:", err))
      .finally(() => setLoading(false));
  };

  const showNotification = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  const filteredLugares = lugares.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.nombre || '').toLowerCase().includes(q) ||
      (l.descripcion || '').toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingLugar(null);
    setFormData({
      nombre: '',
      descripcion: '',
      imagen: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (lugar) => {
    setEditingLugar(lugar);
    setFormData({
      nombre: lugar.nombre || '',
      descripcion: lugar.descripcion || '',
      imagen: lugar.imagen || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingLugar) {
        await updateAdminLugar(editingLugar.id, formData);
        showNotification('✅ Lugar turístico actualizado correctamente');
      } else {
        await createAdminLugar(formData);
        showNotification('✅ Lugar turístico registrado exitosamente');
      }
      setShowModal(false);
      setEditingLugar(null);
      fetchLugares();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar el lugar');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!lugarToDelete) return;
    try {
      await deleteAdminLugar(lugarToDelete.id);
      setLugarToDelete(null);
      fetchLugares();
      showNotification('✅ Lugar eliminado exitosamente de la base de datos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al eliminar el lugar');
      setLugarToDelete(null);
    }
  };

  // EXPORTAR EXCEL
  const exportExcel = () => {
    const dataToExport = filteredLugares.map((l) => ({
      'ID': l.id,
      'Lugar Turístico': l.nombre,
      'Descripción': l.descripcion,
      'Enlace Imagen': l.imagen || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lugares');
    XLSX.writeFile(wb, 'Lugares_Turisticos_EmiTours.xlsx');
  };

  // EXPORTAR PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(2, 132, 199);
    doc.text('EmiTours - Catálogo de Lugares Turísticos', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el: ${new Date().toLocaleString()} | Total: ${filteredLugares.length} lugares`, 14, 22);

    const tableData = filteredLugares.map((l) => [
      `#${l.id}`,
      l.nombre,
      l.descripcion ? (l.descripcion.length > 95 ? l.descripcion.substring(0, 92) + '...' : l.descripcion) : 'Sin descripción',
      l.imagen ? (l.imagen.startsWith('http') ? 'Enlace Web' : 'Archivo') : 'Sin imagen'
    ]);

    const tableConfig = {
      head: [['ID', 'Nombre del Lugar', 'Descripción', 'Referencia Imagen']],
      body: tableData,
      startY: 28,
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 44 },
        2: { cellWidth: 92 },
        3: { cellWidth: 30 }
      }
    };

    if (typeof doc.autoTable === 'function') {
      doc.autoTable(tableConfig);
    } else {
      autoTable(doc, tableConfig);
    }

    doc.save('Lugares_Turisticos_EmiTours.pdf');
  };

  return (
    <div className="admin-page-view">
      {/* HEADER DE LA PÁGINA */}
      <div className="page-title-bar">
        <div>
          <h2 className="page-heading">Gestión de Lugares Turísticos</h2>
          <p className="page-subheading">
            Administra los destinos, recorridos y atractivos disponibles en EmiTours
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
            <FaPlus /> Crear Nuevo Lugar
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="admin-alert-banner">
          <FaCheckCircle /> {alertMsg}
        </div>
      )}

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="table-filter-bar">
        <div className="filter-search-box">
          <FaSearch className="search-box-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre del lugar o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-count-badge">
          Total: <strong>{filteredLugares.length}</strong> lugares
        </div>
      </div>

      {/* TABLA DE LUGARES */}
      {loading ? (
        <div className="admin-table-loading">
          <div className="dashboard-spinner"></div>
          <p>Cargando lugares turísticos...</p>
        </div>
      ) : (
        <div className="admin-card-table-wrapper">
          <table className="admin-modern-table">
            <thead>
              <tr>
                <th>Fotografía</th>
                <th>Nombre del Lugar</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLugares.length === 0 ? (
                <tr>
                  <td colSpan="4" className="table-empty-notice">
                    No se encontraron lugares turísticos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLugares.map((l) => {
                  const resolvedImg = resolveLugarPhoto(l.imagen, l.nombre);
                  return (
                    <tr key={l.id}>
                      <td style={{ width: '110px' }}>
                        <div style={{
                          width: '80px',
                          height: '56px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '2px solid #e0f2fe',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={resolvedImg}
                            alt={l.nombre}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400';
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{l.nombre}</strong>
                          <span style={{ display: 'block', fontSize: '11.5px', color: '#0284c7', fontWeight: '600' }}>
                            ID #{l.id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <p style={{
                          margin: 0,
                          maxWidth: '460px',
                          color: '#475569',
                          fontSize: '13px',
                          lineHeight: '1.45',
                          display: '-webkit-box',
                          WebkitLineClamp: '2',
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {l.descripcion}
                        </p>
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            className="table-btn-action view"
                            onClick={() => setSelectedLugarView(l)}
                            title="Ver detalles completos del lugar"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="table-btn-action edit"
                            onClick={() => handleOpenEdit(l)}
                            title="Editar Lugar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="table-btn-action delete"
                            onClick={() => setLugarToDelete(l)}
                            title="Eliminar Lugar"
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

      {/* MODAL 1: VER DETALLES COMPLETOS DEL LUGAR */}
      {selectedLugarView && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '580px' }}>
            <div style={{
              width: '100%',
              height: '240px',
              borderRadius: '14px',
              overflow: 'hidden',
              marginBottom: '18px',
              backgroundColor: '#f1f5f9'
            }}>
              <img
                src={resolveLugarPhoto(selectedLugarView.imagen, selectedLugarView.nombre)}
                alt={selectedLugarView.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600';
                }}
              />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              {selectedLugarView.nombre}
            </h3>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
              Identificador: Lugar #{selectedLugarView.id}
            </span>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', fontSize: '14px', lineHeight: '1.6', marginBottom: '22px' }}>
              {selectedLugarView.descripcion}
            </div>
            <div className="modal-actions-end">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setSelectedLugarView(null)}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR / EDITAR LUGAR */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '600px' }}>
            <h3>{editingLugar ? `Editar Lugar #${editingLugar.id}: ${editingLugar.nombre}` : 'Crear Nuevo Lugar Turístico'}</h3>
            <p className="modal-subtitle">
              Los datos se guardarán directamente en la tabla lugares de la base de datos
            </p>

            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="form-group-field">
                <label>Nombre del Lugar Turístico *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Comuna 13 y Graffitour"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="form-group-field">
                <label>Descripción *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe la experiencia turística, historia y detalles del tour..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="form-group-field">
                <label>URL de la Fotografía / Imagen</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg o ruta"
                  value={formData.imagen}
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                />
              </div>

              {/* VISTA PREVIA DE LA IMAGEN */}
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
                  src={resolveLugarPhoto(formData.imagen, formData.nombre)}
                  alt="Vista previa"
                  style={{
                    width: '90px',
                    height: '60px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '2px solid #0284c7'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400';
                  }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                    Vista Previa de la Fotografía
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {formData.imagen ? formData.imagen : 'Previsualización estándar'}
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
                  {editingLugar ? 'Guardar Cambios' : 'Publicar Lugar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMACIÓN PARA ELIMINAR LUGAR */}
      {lugarToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card confirm-modal-card">
            <div className="confirm-icon-wrapper">
              <FaExclamationTriangle />
            </div>
            <h3 className="confirm-title">¿Eliminar este lugar turístico?</h3>
            <p className="confirm-message">
              ¿Estás seguro de que deseas eliminar <strong>{lugarToDelete.nombre}</strong>? Esta acción no se puede deshacer y desvinculará las reservas asociadas.
            </p>
            <div className="confirm-actions-row">
              <button
                className="btn-secondary-action"
                onClick={() => setLugarToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger-action"
                onClick={handleDeleteConfirm}
              >
                Sí, Eliminar Lugar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
