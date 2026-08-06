import React, { useEffect, useState } from 'react';
import { getAdminPromociones, createAdminPromocion } from '../api';
import { FaTag, FaPlus } from 'react-icons/fa';

export default function AdminPromociones() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ tipo: 'Promocion', titulo: '', descripcion: '', descuento_porcentaje: 15, cupon: '' });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = () => {
    getAdminPromociones()
      .then((res) => setPromos(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await createAdminPromocion(formData);
    setShowModal(false);
    fetchPromos();
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Promociones y Descuentos</h2>
          <p>Creación y gestión de cupones de descuento y promociones</p>
        </div>
        <button className="btn-save" onClick={() => setShowModal(true)}>
          <FaPlus /> Crear Promoción
        </button>
      </div>

      {loading ? (
        <div className="loading-text">Cargando promociones...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Cupón</th>
                <th>Descuento</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><strong>{p.titulo}</strong></td>
                  <td><code style={{ background: 'rgba(59,130,246,0.2)', padding: '2px 8px', borderRadius: '4px', color: '#60a5fa' }}>{p.cupon || 'N/A'}</code></td>
                  <td><strong style={{ color: '#10b981' }}>{p.descuento_porcentaje}% OFF</strong></td>
                  <td>{p.tipo}</td>
                  <td><span className="badge-status active">Activo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Nueva Promoción / Cupon</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Título Promocional</label>
                <input type="text" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Código de Cupón</label>
                <input type="text" required placeholder="EJ: EMITOURS15" value={formData.cupon} onChange={(e) => setFormData({ ...formData, cupon: e.target.value.toUpperCase() })} />
              </div>
              <div className="form-group">
                <label>Porcentaje Descuento (%)</label>
                <input type="number" required value={formData.descuento_porcentaje} onChange={(e) => setFormData({ ...formData, descuento_porcentaje: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar Promoción</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
