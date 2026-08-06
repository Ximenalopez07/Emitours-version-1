import React, { createContext, useState, useEffect } from 'react';
import { adminLogin as loginApi, adminVerifySession } from '../api';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      adminVerifySession()
        .then((res) => {
          if (res.data.status === 'OK') {
            setAdmin(res.data.admin);
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (correo, contrasena) => {
    const res = await loginApi({ correo, contrasena });
    if (res.data.status === 'OK') {
      const newToken = res.data.token;
      const newAdmin = res.data.admin;
      localStorage.setItem('adminToken', newToken);
      setToken(newToken);
      setAdmin(newAdmin);
      return newAdmin;
    } else {
      throw new Error(res.data.mensaje || 'Error de autenticación');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdmin(null);
    window.location.href = '/inicioseccion';
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
