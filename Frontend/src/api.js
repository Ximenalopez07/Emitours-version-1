import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Esto usará el proxy configurado en vite.config.js
});

// Interceptor para inyectar Token de Administrador o Usuario en todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const getReservas = (params) => api.get('/reservas', { params });
export const createReserva = (reservaData) => api.post('/reservas', reservaData);
export const updateReserva = (id, reservaData) => api.put(`/reservas/${id}`, reservaData);
export const deleteReserva = (id) => api.delete(`/reservas/${id}`);

export const enviarContacto = (contactoData) => api.post('/contacto', contactoData);
export const getAdminContacto = () => api.get('/contacto/admin');
export const responderAdminContacto = (id, data) => api.put(`/contacto/admin/${id}/responder`, data);

export const enviarMensajeChatbot = (mensajeData) => api.post('/chatbot/message', mensajeData);
export const getAdminChatbotHistory = () => api.get('/chatbot/admin/history');
export const getAdminChatbotConfig = () => api.get('/chatbot/admin/config');
export const updateAdminChatbotConfig = (data) => api.put('/chatbot/admin/config', data);

export const loginUsuario = (credenciales) => api.post('/usuarios/login', credenciales);
export const registroUsuario = (userData) => api.post('/usuarios', userData);
export const updateUsuario = (id, userData) => api.put(`/usuarios/${id}`, userData);
export const cambiarContrasena = (id, passwordData) => api.put(`/usuarios/${id}/password`, passwordData);
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);

export const getLugares = () => api.get('/lugares');
export const getGuias = () => api.get('/guias');

// ================= API PANEL DE ADMINISTRACIÓN =================
export const adminLogin = (credentials) => api.post('/admin/auth/login', credentials);
export const adminVerifySession = () => api.get('/admin/auth/verify');
export const getAdminStats = () => api.get('/admin/stats');

export const getAdminUsuarios = () => api.get('/admin/usuarios');
export const updateAdminUsuario = (id, data) => api.put(`/admin/usuarios/${id}`, data);

export const getAdminAdministradores = () => api.get('/admin/administradores');
export const createAdminAdministrador = (data) => api.post('/admin/administradores', data);
export const updateAdminAdministrador = (id, data) => api.put(`/admin/administradores/${id}`, data);
export const deleteAdminAdministrador = (id) => api.delete(`/admin/administradores/${id}`);

export const getAdminLugares = () => api.get('/admin/lugares');
export const createAdminLugar = (data) => api.post('/admin/lugares', data);
export const updateAdminLugar = (id, data) => api.put(`/admin/lugares/${id}`, data);
export const deleteAdminLugar = (id) => api.delete(`/admin/lugares/${id}`);

export const getAdminCategorias = () => api.get('/admin/categorias');
export const createAdminCategoria = (data) => api.post('/admin/categorias', data);
export const updateAdminCategoria = (id, data) => api.put(`/admin/categorias/${id}`, data);
export const deleteAdminCategoria = (id) => api.delete(`/admin/categorias/${id}`);

export const getAdminReservas = () => api.get('/admin/reservas');
export const updateAdminReservaStatus = (id, data) => api.put(`/admin/reservas/${id}/estado`, data);

export const getAdminPagos = () => api.get('/admin/pagos');

export const getAdminComentarios = () => api.get('/admin/comentarios');
export const updateAdminComentario = (id, data) => api.put(`/admin/comentarios/${id}`, data);

export const getAdminPromociones = () => api.get('/admin/promociones');
export const createAdminPromocion = (data) => api.post('/admin/promociones', data);

export const getAdminConfiguracion = () => api.get('/admin/configuracion');
export const updateAdminConfiguracion = (data) => api.put('/admin/configuracion', data);

export const getAdminNotificaciones = () => api.get('/admin/notificaciones');

export default api;
