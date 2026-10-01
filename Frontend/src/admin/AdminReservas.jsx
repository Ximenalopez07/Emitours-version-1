import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAdminReservas,
  updateAdminReservaStatus,
  updateAdminReserva,
  deleteAdminReserva
} from '../api';
import {
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaFileExcel,
  FaFilePdf,
  FaClock,
  FaUsers,
  FaMoneyBillWave,
  FaCreditCard,
  FaMapMarkerAlt,
  FaUser,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGlobe,
  FaPhoneAlt,
  FaEnvelope,
  FaTimesCircle
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminUsuarios.css';

export default function AdminReservas() {
  const [searchParams] = useSearchParams();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda (sin calendario)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroIdioma, setFiltroIdioma] = useState('todos');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('todos');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  // Modales
  const [selectedReservaDetail, setSelectedReservaDetail] = useState(null);
  const [editingReserva, setEditingReserva] = useState(null);
  const [payingReserva, setPayingReserva] = useState(null);
  const [statusModalReserva, setStatusModalReserva] = useState(null);
  const [selectedStatusValue, setSelectedStatusValue] = useState('confirmada');
  const [reservaToDelete, setReservaToDelete] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');

  // Formulario para editar reserva
  const [editFormData, setEditFormData] = useState({
    fecha: '',
    hora: '',
    numero_personas: 1,
    idioma: 'es',
    precio_total: 0,
    metodo_pago: 'pse',
    estado_pago: 'pendiente',
    estado: 'pendiente'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    getAdminReservas()
      .then((resReservas) => {
        setReservas(resReservas.data || []);
      })
      .catch((err) => console.error("Error al cargar reservas:", err))
      .finally(() => setLoading(false));
  };

  const showNotification = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 5000);
  };

  // Filtrado integral
  const reservasFiltradas = reservas.filter((r) => {
    // 1. Buscador por código, cliente o lugar turístico
    const q = search.toLowerCase();
    const codigoStr = (r.codigo || `RES-${r.id}`).toLowerCase();
    const clienteStr = `${r.nombre_usuario || ''} ${r.correo_electronico || ''} ${r.telefono || ''}`.toLowerCase();
    const lugarStr = (r.lugar_nombre || '').toLowerCase();

    const matchesSearch = codigoStr.includes(q) || clienteStr.includes(q) || lugarStr.includes(q);
    if (!matchesSearch) return false;

    // 2. Filtro por Estado: Todos, Pendiente, Confirmada, Realizada, Cancelada
    if (filtroEstado !== 'todos') {
      const st = (r.estado || 'pendiente').toLowerCase();
      if (filtroEstado === 'confirmada' && !st.includes('confir') && !st.includes('activa')) return false;
      if (filtroEstado === 'realizada' && !st.includes('realiz')) return false;
      if (filtroEstado === 'pendiente' && !st.includes('pend')) return false;
      if (filtroEstado === 'cancelada' && !st.includes('cancel')) return false;
    }

    // 3. Filtro por Idioma: Todos, Español, Inglés
    if (filtroIdioma !== 'todos') {
      const lang = (r.idioma || 'es').toLowerCase();
      if (filtroIdioma === 'es' && lang !== 'es') return false;
      if (filtroIdioma === 'en' && lang !== 'en') return false;
    }

    // 4. Filtro por Método de Pago: Todos, Nequi, PSE, Efectivo, Datáfono
    if (filtroMetodoPago !== 'todos') {
      const mp = (r.metodo_pago || '').toLowerCase();
      if (!mp.includes(filtroMetodoPago.toLowerCase())) return false;
    }

    return true;
  });

  // Cambiar estado rápido con actualización inmediata en dashboard y MySQL
  const handleQuickStatusChange = async (reserva, nuevoEstado) => {
    const id = reserva.id;
    const esRealizada = nuevoEstado === 'realizada';
    const esPagado = String(reserva.estado_pago || '').toLowerCase().includes('pagad');

    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
    );

    try {
      await updateAdminReservaStatus(id, { estado: nuevoEstado });
      if (esRealizada && !esPagado) {
        showNotification(`⚠️ Reserva #${reserva.codigo || id} marcada como REALIZADA. Queda un saldo pendiente de pago del 50%.`);
      } else {
        showNotification(`✅ Estado de reserva #${reserva.codigo || id} actualizado a: ${nuevoEstado.toUpperCase()}`);
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al actualizar el estado de la reserva');
      loadData();
    }
  };

  // Guardar cambio de estado desde modal
  const handleSaveStatusModal = async (e) => {
    e.preventDefault();
    if (!statusModalReserva) return;
    const esRealizada = selectedStatusValue === 'realizada';
    const esPagado = String(statusModalReserva.estado_pago || '').toLowerCase().includes('pagad');

    try {
      await updateAdminReservaStatus(statusModalReserva.id, { estado: selectedStatusValue });
      if (esRealizada && !esPagado) {
        showNotification(`⚠️ Reserva #${statusModalReserva.codigo || statusModalReserva.id} marcada como REALIZADA. Recuerda registrar el saldo pendiente de pago del 50%.`);
      } else {
        showNotification(`✅ Estado de reserva #${statusModalReserva.codigo || statusModalReserva.id} actualizado a ${selectedStatusValue.toUpperCase()}`);
      }
      setStatusModalReserva(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al cambiar estado');
    }
  };

  // Confirmar registro del pago restante
  const handleConfirmRegisterPayment = async () => {
    if (!payingReserva) return;
    try {
      await updateAdminReserva(payingReserva.id, {
        estado_pago: 'pagado'
      });
      showNotification(`✅ Pago restante registrado con éxito para la reserva #${payingReserva.codigo || payingReserva.id}. Estado de pago: PAGADO (100%).`);
      setPayingReserva(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al registrar el pago restante');
    }
  };

  // Abrir modal de edición de reserva
  const handleOpenEdit = (reserva) => {
    setEditingReserva(reserva);
    setEditFormData({
      fecha: reserva.fecha ? String(reserva.fecha).substring(0, 10) : '',
      hora: reserva.hora || '08:00:00',
      numero_personas: reserva.numero_personas || 1,
      idioma: reserva.idioma || 'es',
      precio_total: reserva.precio_total || 0,
      metodo_pago: reserva.metodo_pago || 'pse',
      estado_pago: reserva.estado_pago || 'pendiente',
      estado: reserva.estado || 'pendiente'
    });
  };

  // Guardar edición de reserva
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReserva) return;
    try {
      await updateAdminReserva(editingReserva.id, editFormData);
      showNotification(`✅ Reserva #${editingReserva.codigo || editingReserva.id} actualizada correctamente`);
      setEditingReserva(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar cambios de la reserva');
    }
  };

  // Confirmar eliminación de reserva
  const handleDeleteConfirm = async () => {
    if (!reservaToDelete) return;
    try {
      await deleteAdminReserva(reservaToDelete.id);
      showNotification(`✅ Reserva #${reservaToDelete.codigo || reservaToDelete.id} eliminada permanentemente de la base de datos`);
      setReservaToDelete(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al eliminar la reserva');
      setReservaToDelete(null);
    }
  };

  // Exportar Excel
  const exportExcel = () => {
    const dataToExport = reservasFiltradas.map((r) => {
      const tot = Number(r.precio_total || 0);
      const esPagado = (r.estado_pago || '').toLowerCase().includes('pagad');
      const abono = esPagado ? tot : Math.round(tot * 0.5);
      const pendiente = esPagado ? 0 : (tot - abono);

      return {
        'Código': r.codigo || `RES-${r.id}`,
        'Cliente': r.nombre_usuario || 'Cliente EmiTours',
        'Correo': r.correo_electronico || 'N/A',
        'Teléfono': r.telefono || 'N/A',
        'Lugar Turístico': r.lugar_nombre || `Tour #${r.lugar_id}`,
        'Fecha': r.fecha ? String(r.fecha).substring(0, 10) : 'N/A',
        'Hora': r.hora || 'N/A',
        'Personas': r.numero_personas,
        'Idioma del Tour': (r.idioma || 'es').toLowerCase() === 'en' ? 'Inglés' : 'Español',
        'Precio Total': `$${tot.toLocaleString()} COP`,
        'Pago Realizado': `$${abono.toLocaleString()} COP`,
        'Saldo Pendiente': `$${pendiente.toLocaleString()} COP`,
        'Método de Pago': r.metodo_pago || 'N/A',
        'Estado del Pago': esPagado ? 'Pagado (100%)' : (r.estado_pago === 'parcial' ? 'Parcial (50%)' : 'Pendiente'),
        'Estado de Reserva': (r.estado || 'Pendiente').toUpperCase()
      };
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    XLSX.writeFile(wb, 'Reservas_EmiTours.xlsx');
  };

  // Exportar PDF
  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.setTextColor(2, 132, 199);
    doc.text('EmiTours - Reporte Oficial de Reservas Turísticas', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el: ${new Date().toLocaleString()} | Total mostradas: ${reservasFiltradas.length}`, 14, 22);

    const tableData = reservasFiltradas.map((r) => {
      const tot = Number(r.precio_total || 0);
      const esPagado = (r.estado_pago || '').toLowerCase().includes('pagad');
      const abono = esPagado ? tot : Math.round(tot * 0.5);
      const pendiente = esPagado ? 0 : (tot - abono);

      return [
        `#${r.id}`,
        r.codigo || `RES-${r.id}`,
        r.nombre_usuario || 'Cliente',
        r.lugar_nombre || `Tour #${r.lugar_id}`,
        r.fecha ? String(r.fecha).substring(0, 10) : 'N/A',
        r.hora ? r.hora.substring(0, 5) : 'N/A',
        `${r.numero_personas}`,
        (r.idioma || 'es').toLowerCase() === 'en' ? 'Inglés' : 'Español',
        `$${tot.toLocaleString()} COP`,
        esPagado ? 'Pagado (100%)' : (r.estado_pago === 'parcial' ? `Parcial (Resta: $${pendiente.toLocaleString()})` : 'Pendiente'),
        (r.estado || 'Pendiente').toUpperCase()
      ];
    });

    const headers = [
      ['ID', 'Código', 'Usuario', 'Lugar', 'Fecha', 'Hora', 'Personas', 'Idioma', 'Precio Total', 'Estado Pago', 'Estado Reserva']
    ];

    const tableConfig = {
      head: headers,
      body: tableData,
      startY: 26,
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    };

    if (typeof doc.autoTable === 'function') {
      doc.autoTable(tableConfig);
    } else {
      autoTable(doc, tableConfig);
    }

    doc.save('Reservas_EmiTours.pdf');
  };

  return (
    <div className="admin-page-view" style={{ width: '100%', maxWidth: '100%' }}>
      {/* HEADER DE LA PÁGINA */}
      <div className="page-title-bar">
        <div>
          <h2 className="page-heading">Gestión de Reservas</h2>
          <p className="page-subheading">
            Supervisa reservaciones, registra pagos y administra los estados de los tours en tiempo real
          </p>
        </div>
        <div className="header-action-buttons">
          <button className="btn-export-file excel" onClick={exportExcel} title="Exportar a Excel">
            <FaFileExcel /> Exportar Excel
          </button>
          <button className="btn-export-file pdf" onClick={exportPDF} title="Exportar a PDF">
            <FaFilePdf /> Exportar PDF
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="admin-alert-banner">
          <FaCheckCircle /> {alertMsg}
        </div>
      )}

      {/* BARRA DE FILTROS ÚTILES */}
      <div className="table-filter-bar" style={{ gap: '14px', flexWrap: 'wrap' }}>
        {/* Buscador de Reserva */}
        <div className="filter-search-box" style={{ flex: '1 1 280px', minWidth: '240px' }}>
          <FaSearch className="search-box-icon" />
          <input
            type="text"
            placeholder="Buscar por código, cliente o lugar turístico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filtro por Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="todos">📌 Todos los Estados</option>
            <option value="pendiente">⏳ Pendiente</option>
            <option value="confirmada">✅ Confirmada</option>
            <option value="realizada">🏁 Realizada</option>
            <option value="cancelada">❌ Cancelada</option>
          </select>
        </div>

        {/* Filtro por Idioma */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={filtroIdioma}
            onChange={(e) => setFiltroIdioma(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #bae6fd',
              backgroundColor: '#f0f9ff',
              fontSize: '13px',
              fontWeight: '700',
              color: '#0284c7',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="todos">🌐 Todos los Idiomas</option>
            <option value="es">🇪🇸 Español</option>
            <option value="en">🇺🇸 Inglés</option>
          </select>
        </div>

        {/* Filtro por Método de Pago */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={filtroMetodoPago}
            onChange={(e) => setFiltroMetodoPago(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="todos">💳 Todos los Métodos de Pago</option>
            <option value="nequi">Nequi</option>
            <option value="pse">PSE</option>
            <option value="efectivo">Efectivo</option>
            <option value="datafono">Datáfono</option>
          </select>
        </div>

        {/* Contador y Limpiar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="filter-count-badge">
            Mostrando <strong>{reservasFiltradas.length}</strong> de <strong>{reservas.length}</strong>
          </span>
          {(search || filtroEstado !== 'todos' || filtroIdioma !== 'todos' || filtroMetodoPago !== 'todos') && (
            <button
              onClick={() => {
                setSearch('');
                setFiltroEstado('todos');
                setFiltroIdioma('todos');
                setFiltroMetodoPago('todos');
              }}
              style={{
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: '600'
              }}
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE RESERVAS (SIN GUÍA ASIGNADA) */}
      {loading ? (
        <div className="admin-table-loading">
          <div className="dashboard-spinner"></div>
          <p>Cargando reservas turísticas...</p>
        </div>
      ) : (
        <div className="admin-card-table-wrapper" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <table className="admin-modern-table" style={{ width: '100%', minWidth: '980px' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                <th style={{ width: '100px' }}>Código</th>
                <th style={{ width: '160px' }}>Usuario</th>
                <th style={{ width: '150px' }}>Lugar</th>
                <th style={{ width: '130px' }}>Fecha y Hora</th>
                <th style={{ width: '130px' }}>Personas / Idioma</th>
                <th style={{ width: '170px' }}>Precios / Saldos</th>
                <th style={{ width: '120px' }}>Estado de Pago</th>
                <th style={{ width: '130px' }}>Estado de Reserva</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="10" className="table-empty-notice">
                    No se encontraron reservas turísticas que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((r) => {
                  const estadoLower = (r.estado || 'pendiente').toLowerCase();
                  const isIngles = (r.idioma || 'es').toLowerCase() === 'en';
                  const tot = Number(r.precio_total || 0);
                  const esPagado = (r.estado_pago || '').toLowerCase().includes('pagad');
                  const abono = esPagado ? tot : Math.round(tot * 0.5);
                  const pendiente = esPagado ? 0 : (tot - abono);

                  return (
                    <tr key={r.id}>
                      {/* ID */}
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                        #{r.id}
                      </td>

                      {/* Código */}
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          color: '#0284c7',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          background: '#f0f9ff',
                          padding: '4px 7px',
                          borderRadius: '6px',
                          border: '1px solid #bae6fd',
                          display: 'inline-block'
                        }}>
                          {r.codigo || `RES-${r.id}`}
                        </span>
                      </td>

                      {/* Usuario */}
                      <td>
                        <div>
                          <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>
                            {r.nombre_usuario || 'Cliente EmiTours'}
                          </strong>
                          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {r.telefono || r.correo_electronico || 'Sin contacto'}
                          </span>
                        </div>
                      </td>

                      {/* Lugar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaMapMarkerAlt style={{ color: '#0284c7', fontSize: '13px', flexShrink: 0 }} />
                          <span style={{ fontWeight: '600', color: '#334155', fontSize: '12.5px' }}>
                            {r.lugar_nombre || `Tour #${r.lugar_id}`}
                          </span>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td>
                        <div>
                          <span style={{ display: 'block', fontWeight: '600', color: '#0f172a', fontSize: '12.5px' }}>
                            {r.fecha ? String(r.fecha).substring(0, 10) : 'Por definir'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaClock style={{ fontSize: '9.5px' }} /> {r.hora ? r.hora.substring(0, 5) : '08:00'}
                          </span>
                        </div>
                      </td>

                      {/* Personas / Idioma */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '700',
                            color: '#0f172a',
                            fontSize: '11.5px'
                          }}>
                            <FaUsers style={{ color: '#0284c7', fontSize: '11px' }} /> {r.numero_personas} {r.numero_personas === 1 ? 'persona' : 'personas'}
                          </span>
                          <span style={{
                            display: 'inline-block',
                            width: 'fit-content',
                            padding: '2px 7px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: isIngles ? '#e0f2fe' : '#fef3c7',
                            color: isIngles ? '#0369a1' : '#b45309',
                            border: `1px solid ${isIngles ? '#7dd3fc' : '#fde68a'}`
                          }}>
                            {isIngles ? '🇺🇸 Inglés' : '🇪🇸 Español'}
                          </span>
                        </div>
                      </td>

                      {/* Precios / Saldos */}
                      <td>
                        <div>
                          <strong style={{ color: '#059669', fontSize: '13px', display: 'block' }}>
                            Total: ${tot.toLocaleString()} COP
                          </strong>
                          <span style={{ fontSize: '11px', color: '#0284c7', display: 'block', fontWeight: '600' }}>
                            Abonado: ${abono.toLocaleString()} COP
                          </span>
                          {pendiente > 0 ? (
                            <span style={{ fontSize: '11px', color: '#b45309', display: 'block', fontWeight: '700' }}>
                              Saldo: ${pendiente.toLocaleString()} COP
                            </span>
                          ) : (
                            <span style={{ fontSize: '10.5px', color: '#059669', display: 'block', fontWeight: '600' }}>
                              ✓ Pagado 100%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado de Pago */}
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: esPagado ? '#ecfdf5' : r.estado_pago === 'parcial' ? '#fffbeb' : '#fef2f2',
                          color: esPagado ? '#059669' : r.estado_pago === 'parcial' ? '#d97706' : '#dc2626',
                          border: `1px solid ${esPagado ? '#a7f3d0' : r.estado_pago === 'parcial' ? '#fde68a' : '#fecaca'}`
                        }}>
                          {esPagado ? 'PAGADO' : (r.estado_pago === 'parcial' ? 'PARCIAL (50%)' : 'PENDIENTE')}
                        </span>
                        <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '2px', textTransform: 'uppercase' }}>
                          {r.metodo_pago || 'PSE'}
                        </span>
                      </td>

                      {/* Estado de Reserva */}
                      <td>
                        <select
                          value={estadoLower.includes('realiz') ? 'realizada' : estadoLower.includes('confir') ? 'confirmada' : estadoLower.includes('cancel') ? 'cancelada' : 'pendiente'}
                          onChange={(e) => handleQuickStatusChange(r, e.target.value)}
                          className={`badge-estado-select estado-${estadoLower.includes('realiz') ? 'realizada' : estadoLower.includes('confir') ? 'confirmada' : estadoLower.includes('cancel') ? 'cancelada' : 'pendiente'}`}
                          title="Cambiar estado de la reserva"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="cancelada">Cancelada</option>
                          <option value="realizada">Realizada</option>
                        </select>
                      </td>

                      {/* Columna Acciones ordenadas */}
                      <td>
                        <div className="table-actions-group" style={{ justifyContent: 'center', gap: '6px' }}>
                          {/* 1. Ver detalles completos */}
                          <button
                            className="table-btn-action view"
                            onClick={() => setSelectedReservaDetail(r)}
                            title="Ver detalles de la reserva"
                          >
                            <FaEye />
                          </button>

                          {/* 2. Cambiar estado modal */}
                          <button
                            className="table-btn-action"
                            style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                            onClick={() => {
                              setStatusModalReserva(r);
                              setSelectedStatusValue(r.estado || 'pendiente');
                            }}
                            title="Cambiar estado de la reserva"
                          >
                            <FaCheck />
                          </button>

                          {/* 3. Registrar pago restante (solo si tiene saldo pendiente) */}
                          {pendiente > 0 && (
                            <button
                              className="table-btn-action"
                              style={{ backgroundColor: '#eff6ff', color: '#0284c7', borderColor: '#bfdbfe' }}
                              onClick={() => setPayingReserva(r)}
                              title={`Registrar pago restante del 50% ($${pendiente.toLocaleString()} COP)`}
                            >
                              <FaMoneyBillWave />
                            </button>
                          )}

                          {/* 4. Editar reserva */}
                          <button
                            className="table-btn-action edit"
                            onClick={() => handleOpenEdit(r)}
                            title="Editar reserva"
                          >
                            <FaEdit />
                          </button>

                          {/* 5. Eliminar reserva con confirmación */}
                          <button
                            className="table-btn-action delete"
                            onClick={() => setReservaToDelete(r)}
                            title="Eliminar reserva"
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

      {/* MODAL 1: DETALLES COMPLETOS DE LA RESERVA (SIN GUÍA ASIGNADA) */}
      {selectedReservaDetail && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', color: '#0f172a' }}>
                  Detalles de la Reserva #{selectedReservaDetail.codigo || selectedReservaDetail.id}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Fecha de creación: {selectedReservaDetail.fecha_creacion ? new Date(selectedReservaDetail.fecha_creacion).toLocaleString() : 'N/A'}
                </span>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: (selectedReservaDetail.estado || '').toLowerCase().includes('realiz') ? '#ede9fe' : (selectedReservaDetail.estado || '').toLowerCase().includes('confir') ? '#dcfce7' : (selectedReservaDetail.estado || '').toLowerCase().includes('cancel') ? '#fee2e2' : '#fef3c7',
                color: (selectedReservaDetail.estado || '').toLowerCase().includes('realiz') ? '#6d28d9' : (selectedReservaDetail.estado || '').toLowerCase().includes('confir') ? '#15803d' : (selectedReservaDetail.estado || '').toLowerCase().includes('cancel') ? '#b91c1c' : '#92400e'
              }}>
                {(selectedReservaDetail.estado || 'Pendiente').toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {/* Información del Cliente */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#0284c7', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Datos del Cliente
                </strong>
                <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#0f172a' }}>
                  {selectedReservaDetail.nombre_usuario || 'Cliente'}
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#475569' }}>
                  ✉️ {selectedReservaDetail.correo_electronico || 'Sin correo'}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                  📞 {selectedReservaDetail.telefono || 'Sin teléfono'}
                </p>
              </div>

              {/* Información del Tour */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#0284c7', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Detalles del Tour
                </strong>
                <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#0f172a' }}>
                  📍 {selectedReservaDetail.lugar_nombre || `Tour #${selectedReservaDetail.lugar_id}`}
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#475569' }}>
                  📅 Fecha: {selectedReservaDetail.fecha ? String(selectedReservaDetail.fecha).substring(0, 10) : 'N/A'} ({selectedReservaDetail.hora || '08:00'})
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                  👥 Cupos: {selectedReservaDetail.numero_personas} personas
                </p>
              </div>

              {/* Idioma y Modalidad */}
              <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#0369a1', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Idioma del Tour
                </strong>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '700', color: '#0369a1' }}>
                  {(selectedReservaDetail.idioma || 'es').toLowerCase() === 'en' ? '🇺🇸 Idioma: Inglés' : '🇪🇸 Idioma: Español'}
                </p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#334155' }}>
                  Coordinación oficial con el equipo de guías turísticos de EmiTours.
                </p>
              </div>

              {/* Información del Pago */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Información de Pago
                </strong>
                {(() => {
                  const tot = Number(selectedReservaDetail.precio_total || 0);
                  const esPagado = (selectedReservaDetail.estado_pago || '').toLowerCase().includes('pagad');
                  const abono = esPagado ? tot : Math.round(tot * 0.5);
                  const pendiente = esPagado ? 0 : (tot - abono);

                  return (
                    <>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '800', color: '#059669', fontSize: '17px' }}>
                        Total: ${tot.toLocaleString()} COP
                      </p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>
                        Abonado: ${abono.toLocaleString()} COP
                      </p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: esPagado ? '#059669' : '#b45309', fontWeight: '600' }}>
                        Saldo pendiente: ${pendiente.toLocaleString()} COP
                      </p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#475569', textTransform: 'capitalize' }}>
                        Método: {selectedReservaDetail.metodo_pago || 'PSE'}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                        Estado pago: <strong>{esPagado ? 'PAGADO (100%)' : (selectedReservaDetail.estado_pago === 'parcial' ? 'PARCIAL (50%)' : (selectedReservaDetail.estado_pago || 'Pendiente'))}</strong>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="modal-actions-end">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setSelectedReservaDetail(null)}
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR PAGO RESTANTE DEL 50% */}
      {payingReserva && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0284c7', marginBottom: '12px' }}>
              <FaMoneyBillWave style={{ fontSize: '24px' }} />
              <h3 style={{ margin: 0 }}>Registrar Pago Restante</h3>
            </div>
            <p className="modal-subtitle">
              Confirma el recibo del pago final del 50% para la reserva <strong>#{payingReserva.codigo || payingReserva.id}</strong>.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              margin: '16px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13.5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Cliente:</span>
                <strong>{payingReserva.nombre_usuario || 'Cliente'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tour:</span>
                <strong>{payingReserva.lugar_nombre}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Precio total:</span>
                <strong>${Number(payingReserva.precio_total || 0).toLocaleString()} COP</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontWeight: '600' }}>
                <span>Abono inicial previo (50%):</span>
                <span>${Math.round(Number(payingReserva.precio_total || 0) * 0.5).toLocaleString()} COP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '800', fontSize: '15px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span>Monto restante a recibir:</span>
                <span>${(Number(payingReserva.precio_total || 0) - Math.round(Number(payingReserva.precio_total || 0) * 0.5)).toLocaleString()} COP</span>
              </div>
            </div>

            <div className="modal-actions-end">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setPayingReserva(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleConfirmRegisterPayment}
              >
                ✓ Confirmar Pago Recibido (100%)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CAMBIAR ESTADO DE LA RESERVA */}
      {statusModalReserva && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <h3>Cambiar Estado de la Reserva #{statusModalReserva.codigo || statusModalReserva.id}</h3>
            <p className="modal-subtitle">
              Actualiza el estado oficial de la reservación turística en la base de datos
            </p>

            <form onSubmit={handleSaveStatusModal} className="admin-modal-form">
              <div className="form-group-field">
                <label>Seleccionar Nuevo Estado</label>
                <select
                  value={selectedStatusValue}
                  onChange={(e) => setSelectedStatusValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    outline: 'none'
                  }}
                >
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="confirmada">✅ Confirmada</option>
                  <option value="realizada">🏁 Realizada</option>
                  <option value="cancelada">❌ Cancelada</option>
                </select>
              </div>

              {(() => {
                const esPagado = (statusModalReserva.estado_pago || '').toLowerCase().includes('pagad');
                const tot = Number(statusModalReserva.precio_total || 0);
                const pend = esPagado ? 0 : (tot - Math.round(tot * 0.5));

                if (selectedStatusValue === 'realizada' && pend > 0) {
                  return (
                    <div style={{
                      padding: '12px 14px',
                      background: '#fffbeb',
                      borderRadius: '10px',
                      border: '1px solid #fde68a',
                      fontSize: '13px',
                      color: '#92400e',
                      lineHeight: '1.4'
                    }}>
                      ⚠️ <strong>Aviso de pago:</strong> Esta reserva solo cuenta con el 50% de abono inicial. Queda un saldo pendiente de <strong>${pend.toLocaleString()} COP</strong> por recaudar al cliente.
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{
                padding: '14px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                color: '#475569',
                lineHeight: '1.5'
              }}>
                <strong>Flujo habitual del tour:</strong>
                <br />
                ⏳ <strong>Pendiente</strong> → ✅ <strong>Confirmada</strong> → 🏁 <strong>Realizada</strong>
                <br />
                O marcar como ❌ <strong>Cancelada</strong> si el cliente no puede asistir.
              </div>

              <div className="modal-actions-end" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setStatusModalReserva(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-action">
                  Guardar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDITAR RESERVA (SIN GUÍA ASIGNADA) */}
      {editingReserva && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '620px' }}>
            <h3>Editar Reserva #{editingReserva.codigo || editingReserva.id}</h3>
            <p className="modal-subtitle">
              Modifica los detalles permitidos para esta reserva
            </p>

            <form onSubmit={handleSaveEdit} className="admin-modal-form">
              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Fecha del Tour *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.fecha}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Hora *</label>
                  <input
                    type="time"
                    required
                    value={editFormData.hora}
                    onChange={(e) => setEditFormData({ ...editFormData, hora: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Número de Personas *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={editFormData.numero_personas}
                    onChange={(e) => setEditFormData({ ...editFormData, numero_personas: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Idioma del Tour *</label>
                  <select
                    value={editFormData.idioma}
                    onChange={(e) => setEditFormData({ ...editFormData, idioma: e.target.value })}
                  >
                    <option value="es">🇪🇸 Español</option>
                    <option value="en">🇺🇸 Inglés</option>
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Precio Total ($ COP) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={editFormData.precio_total}
                    onChange={(e) => setEditFormData({ ...editFormData, precio_total: e.target.value })}
                  />
                </div>
                <div className="form-group-field">
                  <label>Método de Pago</label>
                  <select
                    value={editFormData.metodo_pago}
                    onChange={(e) => setEditFormData({ ...editFormData, metodo_pago: e.target.value })}
                  >
                    <option value="pse">PSE</option>
                    <option value="nequi">Nequi</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="datafono">Datáfono</option>
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group-field">
                  <label>Estado del Pago</label>
                  <select
                    value={editFormData.estado_pago}
                    onChange={(e) => setEditFormData({ ...editFormData, estado_pago: e.target.value })}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="parcial">Parcial (50%)</option>
                    <option value="pagado">Pagado (100%)</option>
                  </select>
                </div>
                <div className="form-group-field">
                  <label>Estado de la Reserva</label>
                  <select
                    value={editFormData.estado}
                    onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-end" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setEditingReserva(null)}
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

      {/* MODAL 5: CONFIRMACIÓN DE ELIMINACIÓN DE RESERVA */}
      {reservaToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card confirm-modal-card">
            <div className="confirm-icon-wrapper">
              <FaExclamationTriangle />
            </div>
            <h3 className="confirm-title">¿Eliminar esta reserva?</h3>
            <p className="confirm-message">
              ¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.
            </p>
            <div style={{
              margin: '16px 0',
              padding: '12px',
              background: '#fff1f2',
              borderRadius: '10px',
              border: '1px solid #fecdd3',
              fontSize: '13px',
              color: '#9f1239'
            }}>
              Reserva: <strong>{reservaToDelete.codigo || `RES-${reservaToDelete.id}`}</strong> | Cliente: <strong>{reservaToDelete.nombre_usuario || 'Cliente'}</strong> | Tour: <strong>{reservaToDelete.lugar_nombre || 'Lugar'}</strong>
            </div>
            <div className="confirm-actions-row">
              <button
                className="btn-secondary-action"
                onClick={() => setReservaToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger-action"
                onClick={handleDeleteConfirm}
              >
                Sí, Eliminar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
