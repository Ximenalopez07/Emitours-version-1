import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../api';
import {
  FaUsers, FaUserCheck, FaUserPlus, FaCalendarCheck, FaClock, FaCalendarTimes,
  FaMapMarkedAlt, FaEyeSlash, FaDollarSign, FaChartLine, FaCheckCircle
} from 'react-icons/fa';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then((res) => {
        if (res.data.status === 'OK') {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.error("Error al cargar dashboard stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="admin-loading-spinner">Cargando datos en tiempo real...</div>;
  }

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};

  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  const DONUT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header-title">
        <h1>Dashboard Principal</h1>
        <p>Resumen analítico en tiempo real de EmiTours</p>
      </div>

      {/* 11 TARJETAS ESTADÍSTICAS REQUERIDAS */}
      <div className="metrics-grid">
        <div className="metric-card blue">
          <div className="metric-icon"><FaUsers /></div>
          <div className="metric-info">
            <span className="metric-label">Total Usuarios Registrados</span>
            <h3 className="metric-value">{cards.totalUsuarios || 0}</h3>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon"><FaUserCheck /></div>
          <div className="metric-info">
            <span className="metric-label">Usuarios Activos</span>
            <h3 className="metric-value">{cards.usuariosActivos || 0}</h3>
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-icon"><FaUserPlus /></div>
          <div className="metric-info">
            <span className="metric-label">Nuevos Este Mes</span>
            <h3 className="metric-value">{cards.usuariosNuevosMes || 0}</h3>
          </div>
        </div>

        <div className="metric-card indigo">
          <div className="metric-icon"><FaCalendarCheck /></div>
          <div className="metric-info">
            <span className="metric-label">Total de Reservas</span>
            <h3 className="metric-value">{cards.totalReservas || 0}</h3>
          </div>
        </div>

        <div className="metric-card emerald">
          <div className="metric-icon"><FaCheckCircle /></div>
          <div className="metric-info">
            <span className="metric-label">Reservas Confirmadas</span>
            <h3 className="metric-value">{cards.reservasConfirmadas || 0}</h3>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-icon"><FaClock /></div>
          <div className="metric-info">
            <span className="metric-label">Reservas Pendientes</span>
            <h3 className="metric-value">{cards.reservasPendientes || 0}</h3>
          </div>
        </div>

        <div className="metric-card red">
          <div className="metric-icon"><FaCalendarTimes /></div>
          <div className="metric-info">
            <span className="metric-label">Reservas Canceladas</span>
            <h3 className="metric-value">{cards.reservasCanceladas || 0}</h3>
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-icon"><FaMapMarkedAlt /></div>
          <div className="metric-info">
            <span className="metric-label">Lugares Publicados</span>
            <h3 className="metric-value">{cards.lugaresPublicados || 0}</h3>
          </div>
        </div>

        <div className="metric-card gray">
          <div className="metric-icon"><FaEyeSlash /></div>
          <div className="metric-info">
            <span className="metric-label">Lugares Desactivados</span>
            <h3 className="metric-value">{cards.lugaresDesactivados || 0}</h3>
          </div>
        </div>

        <div className="metric-card gold">
          <div className="metric-icon"><FaDollarSign /></div>
          <div className="metric-info">
            <span className="metric-label">Total de Ingresos</span>
            <h3 className="metric-value">${(cards.totalIngresos || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="metric-card pink">
          <div className="metric-icon"><FaChartLine /></div>
          <div className="metric-info">
            <span className="metric-label">Promedio Reservas / Día</span>
            <h3 className="metric-value">{cards.promedioReservasDia || 0}</h3>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE LOS 6 GRÁFICOS SOLICITADOS */}
      <div className="charts-grid">

        {/* GRÁFICO 1: RESERVAS POR MES (LINE CHART) */}
        <div className="chart-box">
          <h3>Gráfico 1: Reservas por Mes (Line Chart)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={charts.reservasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                <Line type="monotone" dataKey="cantidad" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: INGRESOS MENSUALES (BAR CHART) */}
        <div className="chart-box">
          <h3>Gráfico 2: Ingresos Mensuales (Bar Chart)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.ingresosMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 3: LUGARES MÁS RESERVADOS (HORIZONTAL BAR) */}
        <div className="chart-box">
          <h3>Gráfico 3: Lugares Más Reservados (Horizontal Bar)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={charts.lugaresMasReservados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="nombre" type="category" stroke="#94a3b8" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="reservas" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 4: ESTADO DE RESERVAS (PIE CHART) */}
        <div className="chart-box">
          <h3>Gráfico 4: Estado de Reservas (Pie Chart)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={charts.estadoReservas} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {charts.estadoReservas?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 5: USUARIOS REGISTRADOS POR MES (AREA CHART) */}
        <div className="chart-box">
          <h3>Gráfico 5: Usuarios Registrados por Mes (Area Chart)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.usuariosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                <Area type="monotone" dataKey="usuarios" stroke="#ec4899" fill="rgba(236, 72, 153, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 6: RESERVAS POR CATEGORÍA (DONUT CHART) */}
        <div className="chart-box">
          <h3>Gráfico 6: Reservas por Categoría (Donut Chart)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={charts.reservasPorCategoria} dataKey="cantidad" nameKey="categoria" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} label>
                  {charts.reservasPorCategoria?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
