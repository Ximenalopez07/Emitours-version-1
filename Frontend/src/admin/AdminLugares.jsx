import React, { useEffect, useState } from 'react';
import { getAdminLugares, createAdminLugar, updateAdminLugar, deleteAdminLugar, getAdminCategorias } from '../api';
import { FaPlus, FaEdit, FaTrash, FaStar, FaMapMarkerAlt } from 'react-icons/fa';

export default function AdminLugares() {
  const [lugares, setLugares] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLugar, setEditingLugar] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', precio: 100000, ubicacion: 'Medellín', categoria_id: 1, duracion: '4 Horas', capacidad: 20, estado: 'Activo', imagen: '', servicios: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resLugares, resCats] = await Promise.all([getAdminLugares(), getAdminCategorias()]);
      setLugares(resLugares.data || []);
      setCategorias(resCats.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingLugar) {
      await updateAdminLugar(editingLugar.id, formData);
    } else {
      await createAdminLugar(formData);
    }
    setShowModal(false);
    setEditingLugar(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Deseas eliminar este lugar turístico?")) {
      await deleteAdminLugar(id);
      fetchData();
    }
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Gestión de Lugares Turísticos</h2>
          <p>Publica y edita los tours y destinos ofrecidos en Medellín</p>
        </div>
        <button className="btn-save" onClick={() => {
          setEditingLugar(null);
          setFormData({ nombre: '', descripcion: '', precio: 100000, ubicacion: 'Medellín', categoria_id: 1, duracion: '4 Horas', capacidad: 20, estado: 'Activo', imagen: '', servicios: '' });
          setShowModal(true);
        }}>
          <FaPlus /> Publicar Nuevo Lugar
        </button>
      </div>

      {loading ? (
        <div className="loading-text">Cargando lugares...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Lugar</th>
                <th>Ubicación</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Duración</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lugares.map((l) => (
                <tr key={l.id}>
                  <td>
                    <img src={l.imagen} alt={l.nombre} className="table-avatar" style={{ borderRadius: '8px', width: '50px', height: '40px' }} />
                  </td>
                  <td><strong>{l.nombre}</strong></td>
                  <td><FaMapMarkerAlt style={{ color: '#ef4444', marginRight: '4px' }} />{l.ubicacion}</td>
                  <td>{l.categoria_nombre || 'General'}</td>
                  <td>${Number(l.precio).toLocaleString()}</td>
                  <td>{l.duracion}</td>
                  <td><span className={`badge-status ${l.estado === 'Activo' ? 'active' : 'inactive'}`}>{l.estado || 'Activo'}</span></td>
                  <td>
                    <button className="action-btn edit me-2" onClick={() => {
                      setEditingLugar(l);
                      setFormData(l);
                      setShowModal(true);
                    }}>
                      <FaEdit />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(l.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>{editingLugar ? 'Editar Lugar Turístico' : 'Nuevo Lugar Turístico'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre del Lugar</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows="3" required value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Precio (COP)</label>
                <input type="number" required value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Imagen (URL)</label>
                <input type="text" required value={formData.imagen} onChange={(e) => setFormData({ ...formData, imagen: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={formData.categoria_id} onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
