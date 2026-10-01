import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../api';
import {
  FaUsers,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSyncAlt,
  FaChartLine,
  FaChartPie,
  FaCreditCard,
  FaSuitcaseRolling
} from 'react-icons/fa';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = () => {
    setRefreshing(true);
    getAdminStats()
      .then((res) => {
        if (res.data?.status === 'OK') {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.error("Error al cargar dashboard stats:", err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading-state">
        <div className="dashboard-spinner"></div>
        <p>Cargando información en tiempo real de EmiTours...</p>
      </div>
    );
  }

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};

  // Colores para el gráfico de estados
  const ESTADO_COLORS = {
    'Confirmada': '#10b981',
    'Pendiente': '#f59e0b',
    'Cancelada': '#ef4444',
    'Sin estado': '#94a3b8'
  };

  // Colores para métodos de pago
  const PAGO_COLORS = ['#0284c7', '#2563eb', '#0d9488', '#8b5cf6', '#64748b'];

  return (
    <div className="admin-dashboard-view">
      {/* HEADER PRINCIPAL */}
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-main-heading">Dashboard Principal</h1>
          <p className="dashboard-sub-heading">
            Métricas y estadísticas oficiales de viajes, reservas y clientes de EmiTours
          </p>
        </div>
        <button
          className="btn-refresh-dashboard"
          onClick={loadStats}
          disabled={refreshing}
          title="Actualizar datos desde la base de datos"
        >
          <FaSyncAlt className={refreshing ? 'spin-anim' : ''} />
          <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* LAS 6 TARJETAS PRINCIPALES REQUERIDAS */}
      <div className="stats-cards-grid">
        {/* 1. Total usuarios registrados */}
        <div className="stat-card card-blue">
          <div className="stat-card-icon">
            <FaUsers />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Usuarios Registrados</span>
            <h2 className="stat-card-number">{cards.totalUsuarios || 0}</h2>
            <span className="stat-card-footnote">Clientes en la plataforma</span>
          </div>
        </div>

        {/* 2. Total de reservas */}
        <div className="stat-card card-indigo">
          <div className="stat-card-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total de Reservas</span>
            <h2 className="stat-card-number">{cards.totalReservas || 0}</h2>
            <span className="stat-card-footnote">Histórico completo</span>
          </div>
        </div>

        {/* 3. Total de lugares turísticos */}
        <div className="stat-card card-cyan">
          <div className="stat-card-icon">
            <FaMapMarkedAlt />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Lugares Turísticos</span>
            <h2 className="stat-card-number">{cards.totalLugares || 0}</h2>
            <span className="stat-card-footnote">Destinos en catálogo</span>
          </div>
        </div>

        {/* 4. Reservas pendientes */}
        <div className="stat-card card-amber">
          <div className="stat-card-icon">
            <FaClock />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Reservas Pendientes</span>
            <h2 className="stat-card-number">{cards.reservasPendientes || 0}</h2>
            <span className="stat-card-footnote">Por coordinar o confirmar</span>
          </div>
        </div>

        {/* 5. Reservas confirmadas */}
        <div className="stat-card card-emerald">
          <div className="stat-card-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Reservas Confirmadas</span>
            <h2 className="stat-card-number">{cards.reservasConfirmadas || 0}</h2>
            <span className="stat-card-footnote">Activas y aprobadas</span>
          </div>
        </div>

        {/* 6. Reservas canceladas */}
        <div className="stat-card card-rose">
          <div className="stat-card-icon">
            <FaTimesCircle />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Reservas Canceladas</span>
            <h2 className="stat-card-number">{cards.reservasCanceladas || 0}</h2>
            <span className="stat-card-footnote">Anuladas por clientes/admin</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE LOS 4 GRÁFICOS REALES */}
      <div className="charts-cards-grid">
        {/* GRÁFICO 1: RESERVAS POR MES */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <FaChartLine className="chart-title-icon text-blue" />
              <h3>Reservas por Mes</h3>
            </div>
            <span className="chart-panel-badge">Tendencia</span>
          </div>
          <div className="chart-render-area">
            {charts.reservasPorMes && charts.reservasPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={charts.reservasPorMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      color: '#0f172a'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    name="Reservas"
                    stroke="#0284c7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReservas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <FaSuitcaseRolling />
                <p>No se registran reservas en este período aún.</p>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: ESTADOS DE LAS RESERVAS */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <FaChartPie className="chart-title-icon text-emerald" />
              <h3>Estados de las Reservas</h3>
            </div>
            <span className="chart-panel-badge">Distribución</span>
          </div>
          <div className="chart-render-area">
            {charts.estadoReservas && charts.estadoReservas.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.estadoReservas}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {charts.estadoReservas.map((entry, index) => (
                      <Cell
                        key={`cell-estado-${index}`}
                        fill={ESTADO_COLORS[entry.name] || PAGO_COLORS[index % PAGO_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <FaChartPie />
                <p>No hay datos suficientes para calcular estados.</p>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 3: MÉTODOS DE PAGO UTILIZADOS */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <FaCreditCard className="chart-title-icon text-indigo" />
              <h3>Métodos de Pago Utilizados</h3>
            </div>
            <span className="chart-panel-badge">Preferencias</span>
          </div>
          <div className="chart-render-area">
            {charts.metodosPago && charts.metodosPago.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.metodosPago} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Bar dataKey="cantidad" name="Pagos" radius={[6, 6, 0, 0]}>
                    {charts.metodosPago.map((entry, index) => (
                      <Cell key={`cell-pago-${index}`} fill={PAGO_COLORS[index % PAGO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <FaCreditCard />
                <p>No hay registros de métodos de pago.</p>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 4: LUGARES MÁS RESERVADOS */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <div className="chart-panel-title">
              <FaMapMarkedAlt className="chart-title-icon text-cyan" />
              <h3>Lugares Más Reservados</h3>
            </div>
            <span className="chart-panel-badge">Populares</span>
          </div>
          <div className="chart-render-area">
            {charts.lugaresMasReservados && charts.lugaresMasReservados.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  layout="vertical"
                  data={charts.lugaresMasReservados}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} />
                  <YAxis dataKey="nombre" type="category" stroke="#0f172a" fontSize={12} width={110} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Bar dataKey="reservas" name="Reservas" fill="#0284c7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <FaMapMarkedAlt />
                <p>Aún no hay reservas asociadas a lugares turísticos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

