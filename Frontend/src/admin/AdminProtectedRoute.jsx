import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';

export default function AdminProtectedRoute() {
  const { token, loading } = useContext(AdminAuthContext);

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', padding: '100px' }}>Verificando credenciales de administrador...</div>;
  }

  if (!token) {
    return <Navigate to="/inicioseccion" replace />;
  }

  return <Outlet />;
}
