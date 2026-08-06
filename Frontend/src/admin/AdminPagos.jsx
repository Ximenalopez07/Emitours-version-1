import React, { useEffect, useState } from 'react';
import { getAdminPagos } from '../api';
import { FaMoneyBillWave, FaCheckCircle, FaClock } from 'react-icons/fa';

export default function AdminPagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminPagos()
      .then((res) => setPagos(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Gestión de Pagos</h2>
          <p>Historial de transacciones y estados de pago recibidos</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Cargando pagos...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código Reserva</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Método de Pago</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><strong>{p.reserva_codigo || `RES-${p.reserva_id}`}</strong></td>
                  <td>{p.nombre_usuario || 'Cliente'}</td>
                  <td><strong style={{ color: '#10b981' }}>${Number(p.monto).toLocaleString()} COP</strong></td>
                  <td>{p.metodo_pago}</td>
                  <td>{new Date(p.fecha).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge-status ${p.estado === 'Pagado' ? 'active' : 'amber'}`}>
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
