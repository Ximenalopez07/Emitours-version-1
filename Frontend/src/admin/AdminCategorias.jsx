import React, { useEffect, useState } from 'react';
import { getAdminCategorias, createAdminCategoria, updateAdminCategoria, deleteAdminCategoria } from '../api';
import { FaPlus, FaEdit, FaTrash, FaFolder } from 'react-icons/fa';

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', icono: 'FaFolder', estado: 'Activo' });

  useEffect(() => {
    fetchCats();
  }, []);

  const fetchCats = () => {
    getAdminCategorias()
      .then((res) => setCategorias(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingCat) {
      await updateAdminCategoria(editingCat.id, formData);
    } else {
      await createAdminCategoria(formData);
    }
    setShowModal(false);
    setEditingCat(null);
    fetchCats();
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar esta categoría?")) {
      await deleteAdminCategoria(id);
      fetchCats();
    }
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Gestión de Categorías</h2>
          <p>Clasificación de experiencias y destinos turísticos</p>
        </div>
        <button className="btn-save" onClick={() => {
          setEditingCat(null);
          setFormData({ nombre: '', descripcion: '', icono: 'FaFolder', estado: 'Activo' });
          setShowModal(true);
        }}>
          <FaPlus /> Crear Categoría
        </button>
      </div>

      {loading ? (
        <div className="loading-text">Cargando categorías...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td><strong><FaFolder style={{ marginRight: '8px', color: '#3b82f6' }} />{c.nombre}</strong></td>
                  <td>{c.descripcion}</td>
                  <td><span className={`badge-status ${c.estado === 'Activo' ? 'active' : 'inactive'}`}>{c.estado}</span></td>
                  <td>
                    <button className="action-btn edit me-2" onClick={() => {
                      setEditingCat(c);
                      setFormData(c);
                      setShowModal(true);
                    }}>
                      <FaEdit />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(c.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
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
            <h3>{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre de Categoría</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows="3" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
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
