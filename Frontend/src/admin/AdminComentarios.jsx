import React, { useEffect, useState } from 'react';
import { getAdminComentarios, updateAdminComentario } from '../api';
import { FaCheck, FaEyeSlash, FaReply, FaStar } from 'react-icons/fa';

export default function AdminComentarios() {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = () => {
    getAdminComentarios()
      .then((res) => setComentarios(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleModerate = async (id, estado) => {
    await updateAdminComentario(id, { estado });
    fetchComments();
  };

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h2>Gestión de Comentarios y Moderación</h2>
          <p>Revisa y modera las opiniones dejadas por los turistas</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Cargando comentarios...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Lugar Turístico</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comentarios.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.nombre_usuario || 'Turista'}</strong></td>
                  <td>{c.lugar_nombre || 'Tour Medellín'}</td>
                  <td>
                    {[...Array(c.calificacion || 5)].map((_, i) => (
                      <FaStar key={i} style={{ color: '#f59e0b', fontSize: '12px' }} />
                    ))}
                  </td>
                  <td>"{c.comentario}"</td>
                  <td><span className={`badge-status ${c.estado === 'Aprobado' ? 'active' : 'inactive'}`}>{c.estado}</span></td>
                  <td>
                    <button className="action-btn edit me-1" onClick={() => handleModerate(c.id, 'Aprobado')} title="Aprobar">
                      <FaCheck />
                    </button>
                    <button className="action-btn delete me-1" onClick={() => handleModerate(c.id, 'Oculto')} title="Ocultar">
                      <FaEyeSlash />
                    </button>
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
