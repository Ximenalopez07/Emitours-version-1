import React, { useEffect, useState } from 'react';
import { getAdminReservas, updateAdminReservaStatus } from '../api';
import { FaFileInvoice, FaCheck, FaTimes, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminReservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceReserva, setInvoiceReserva] = useState(null);

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

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reservas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    XLSX.writeFile(wb, 'Reservas_EmiTours.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Reservas - EmiTours', 14, 15);
    const tableData = reservas.map(r => [
      r.codigo || `RES-${r.id}`,
      r.nombre_usuario || 'Cliente',
      r.lugar_nombre || 'Tour',
      r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A',
      r.numero_personas,
      r.estado
    ]);
    doc.autoTable({
      head: [['Código', 'Cliente', 'Lugar', 'Fecha', 'Personas', 'Estado']],
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
          <p>Control operativo y facturación de reservas realizadas</p>
        </div>
        <div className="header-actions">
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
                <th>Fecha</th>
                <th>Hora</th>
                <th>Personas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.codigo || `RES-${r.id}`}</strong></td>
                  <td>{r.nombre_usuario || 'Cliente'}</td>
                  <td>{r.lugar_nombre || 'Tour Medellín'}</td>
                  <td>{r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A'}</td>
                  <td>{r.hora}</td>
                  <td>{r.numero_personas} Personas</td>
                  <td>
                    <span className={`badge-status ${r.estado === 'Confirmada' || r.estado === 'activa' ? 'active' : r.estado === 'Cancelada' ? 'inactive' : 'amber'}`}>
                      {r.estado}
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
              ))}
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
              <p><strong>Cliente:</strong> {invoiceReserva.nombre_usuario}</p>
              <p><strong>Tour/Lugar:</strong> {invoiceReserva.lugar_nombre || 'Tour Medellín'}</p>
              <p><strong>Fecha y Hora:</strong> {new Date(invoiceReserva.fecha).toLocaleDateString()} - {invoiceReserva.hora}</p>
              <p><strong>Número de Personas:</strong> {invoiceReserva.numero_personas}</p>
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
