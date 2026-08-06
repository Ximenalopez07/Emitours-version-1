import React from 'react';
import { getAdminUsuarios, getAdminReservas, getAdminPagos, getAdminLugares } from '../api';
import { FaFilePdf, FaFileExcel, FaFileCsv } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminReportes() {
  const downloadReport = async (tipo, formato) => {
    try {
      let data = [];
      let filename = `Reporte_${tipo}_EmiTours`;

      if (tipo === 'Usuarios') {
        const res = await getAdminUsuarios();
        data = res.data;
      } else if (tipo === 'Reservas') {
        const res = await getAdminReservas();
        data = res.data;
      } else if (tipo === 'Pagos') {
        const res = await getAdminPagos();
        data = res.data;
      } else {
        const res = await getAdminLugares();
        data = res.data;
      }

      if (formato === 'excel') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, tipo);
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else if (formato === 'pdf') {
        const doc = new jsPDF();
        doc.text(`Reporte Oficial de ${tipo} - EmiTours`, 14, 15);
        if (data.length > 0) {
          const keys = Object.keys(data[0]).slice(0, 5);
          const body = data.map(item => keys.map(k => String(item[k] || '')));
          doc.autoTable({ head: [keys], body, startY: 22 });
        }
        doc.save(`${filename}.pdf`);
      } else {
        // CSV
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      alert("Error al exportar reporte: " + e.message);
    }
  };

  const reportes = ['Usuarios', 'Reservas', 'Pagos', 'Lugares Turísticos'];

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Generador de Reportes Oficiales</h2>
          <p>Exporta consolidados en formatos PDF, Excel y CSV</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {reportes.map((r) => (
          <div key={r} className="chart-box" style={{ background: 'rgba(30,41,59,0.5)', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}>Reporte de {r}</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Descarga la información completa del módulo de {r}.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="btn-export pdf" onClick={() => downloadReport(r.split(' ')[0], 'pdf')}><FaFilePdf /> PDF</button>
              <button className="btn-export excel" onClick={() => downloadReport(r.split(' ')[0], 'excel')}><FaFileExcel /> Excel</button>
              <button className="btn-cancel" onClick={() => downloadReport(r.split(' ')[0], 'csv')}><FaFileCsv /> CSV</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
