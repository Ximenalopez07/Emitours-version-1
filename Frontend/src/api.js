import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Esto usará el proxy configurado en vite.config.js
});

export const getReservas = () => api.get('/reservas');
export const createReserva = (reservaData) => api.post('/reservas', reservaData);
export const updateReserva = (id, reservaData) => api.put(`/reservas/${id}`, reservaData);
export const deleteReserva = (id) => api.delete(`/reservas/${id}`);

export const loginUsuario = (credenciales) => api.post('/usuarios/login', credenciales);
export const registroUsuario = (userData) => api.post('/usuarios', userData);

export default api;
