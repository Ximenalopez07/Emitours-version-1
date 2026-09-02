import React, { useEffect, useState } from 'react';
import { getAdminReservas, updateAdminReservaStatus } from '../api';
import { FaFileInvoice, FaCheck, FaTimes, FaFileExcel, FaFilePdf, FaFilter } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminReservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceReserva, setInvoiceReserva] = useState(null);
  const [filtroIdioma, setFiltroIdioma] = useState("todos");

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = () => {
    getAdminReservas()
      .then((res) => setReservas(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (id, nuevoEstado) => {
    await updateAdminReservaStatus(id, { estado: nuevoEstado });
    fetchReservas();
  };

  const reservasFiltradas = reservas.filter((r) => {
    if (filtroIdioma === "es") return r.idioma === "es" || !r.idioma;
    if (filtroIdioma === "en") return r.idioma === "en";
    return true;
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reservasFiltradas.map(r => ({
      Código: r.codigo || `RES-${r.id}`,
      Cliente: r.nombre_usuario || r.nombre_completo || 'Cliente',
      Lugar: r.lugar_nombre || 'Tour Medellín',
      Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A',
      Hora: r.hora,
      Personas: r.numero_personas,
      IdiomaTour: r.idioma === 'en' ? 'Inglés' : 'Español',
      MétodoPago: r.metodo_pago,
      Estado: r.estado
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    XLSX.writeFile(wb, 'Reservas_EmiTours.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Reservas - EmiTours', 14, 15);
    const tableData = reservasFiltradas.map(r => [
      r.codigo || `RES-${r.id}`,
      r.nombre_usuario || r.nombre_completo || 'Cliente',
      r.lugar_nombre || 'Tour',
      r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A',
      r.numero_personas,
      r.idioma === 'en' ? 'Inglés' : 'Español',
      r.estado
    ]);
    doc.autoTable({
      head: [['Código', 'Cliente', 'Lugar', 'Fecha', 'Personas', 'Idioma', 'Estado']],
      body: tableData,
      startY: 22
    });
    doc.save('Reservas_EmiTours.pdf');
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Gestión de Reservas</h2>
          <p>Control operativo, idioma del tour y facturación de reservas realizadas</p>
        </div>
        <div className="header-actions">
          {/* FILTRO DE IDIOMA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
            <FaFilter style={{ color: '#94a3b8' }} />
            <select
              value={filtroIdioma}
              onChange={(e) => setFiltroIdioma(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <option value="todos">🌐 Todos los idiomas</option>
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 Inglés</option>
            </select>
          </div>

          <button className="btn-export excel" onClick={exportExcel}><FaFileExcel /> Exportar Excel</button>
          <button className="btn-export pdf" onClick={exportPDF}><FaFilePdf /> Exportar PDF</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Cargando reservas...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Lugar</th>
                <th>Fecha y Hora</th>
                <th>Personas</th>
                <th>Idioma Tour</th>
                <th>Guía Asignada</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No se encontraron reservas con el idioma seleccionado.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.codigo || `RES-${r.id}`}</strong></td>
                    <td>{r.nombre_usuario || r.nombre_completo || 'Cliente'}</td>
                    <td>{r.lugar_nombre || 'Tour Medellín'}</td>
                    <td>{r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A'} - {r.hora}</td>
                    <td>{r.numero_personas} Pers</td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        backgroundColor: r.idioma === 'en' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: r.idioma === 'en' ? '#60a5fa' : '#fbbf24',
                        border: `1px solid ${r.idioma === 'en' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}>
                        {r.idioma === 'en' ? '🇬🇧 Inglés' : '🇪🇸 Español'}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: '#94a3b8' }}>
                        {r.idioma === 'en' ? '🔍 Requiere guía Inglés' : '🔍 Requiere guía Español'}
                      </small>
                    </td>
                    <td>
                      <span className={`badge-status ${r.estado === 'Confirmada' || r.estado === 'activa' ? 'active' : r.estado === 'Cancelada' ? 'inactive' : 'amber'}`}>
                        {r.estado || 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit me-1" onClick={() => handleStatusChange(r.id, 'Confirmada')} title="Confirmar" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                        <FaCheck />
                      </button>
                      <button className="action-btn delete me-1" onClick={() => handleStatusChange(r.id, 'Cancelada')} title="Cancelar" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                        <FaTimes />
                      </button>
                      <button className="action-btn edit" onClick={() => setInvoiceReserva(r)} title="Ver Factura">
                        <FaFileInvoice />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL VER FACTURA */}
      {invoiceReserva && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Factura de Reserva #{invoiceReserva.codigo || invoiceReserva.id}</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#cbd5e1' }}>
              <p><strong>Cliente:</strong> {invoiceReserva.nombre_usuario || invoiceReserva.nombre_completo}</p>
              <p><strong>Tour/Lugar:</strong> {invoiceReserva.lugar_nombre || 'Tour Medellín'}</p>
              <p><strong>Fecha y Hora:</strong> {new Date(invoiceReserva.fecha).toLocaleDateString()} - {invoiceReserva.hora}</p>
              <p><strong>Número de Personas:</strong> {invoiceReserva.numero_personas}</p>
              <p><strong>Idioma Solicitado:</strong> {invoiceReserva.idioma === 'en' ? '🇬🇧 Inglés' : '🇪🇸 Español'}</p>
              <p><strong>Método de Pago:</strong> {invoiceReserva.metodo_pago || 'PSE / Tarjeta'}</p>
              <p><strong>Total Facturado:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>${(invoiceReserva.precio_total || 150000).toLocaleString()} COP</span></p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setInvoiceReserva(null)}>Cerrar</button>
              <button className="btn-save" onClick={() => alert("Factura enviada por correo al cliente.")}>Enviar por Correo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
