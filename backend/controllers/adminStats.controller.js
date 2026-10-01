const db = require('../config/db');

// OBTENER ESTADÍSTICAS Y MÉTRICAS REALES DEL DASHBOARD
exports.getDashboardStats = async (req, res) => {
  try {
    const p = (query, params = []) => new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => err ? reject(err) : resolve(results));
    });

    // 1. Tarjetas Estadísticas Reales Requeridas
    // 1.1 Total usuarios registrados (clientes)
    const totalUsuariosRes = await p("SELECT COUNT(*) as count FROM registro_usuarios WHERE rol != 'admin' OR rol IS NULL");
    
    // 1.2 Total de reservas
    const totalReservasRes = await p("SELECT COUNT(*) as count FROM reservas");
    
    // 1.3 Total de lugares turísticos
    const totalLugaresRes = await p("SELECT COUNT(*) as count FROM lugares");

    // 1.4 Reservas pendientes
    const reservasPendientesRes = await p("SELECT COUNT(*) as count FROM reservas WHERE LOWER(estado) = 'pendiente'");

    // 1.5 Reservas confirmadas
    const reservasConfirmadasRes = await p("SELECT COUNT(*) as count FROM reservas WHERE LOWER(estado) IN ('confirmada', 'activa')");

    // 1.6 Reservas canceladas
    const reservasCanceladasRes = await p("SELECT COUNT(*) as count FROM reservas WHERE LOWER(estado) = 'cancelada'");

    // 2. Gráfico 1: Reservas por mes (datos reales)
    const reservasPorMesRes = await p(`
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as mes_key,
        DATE_FORMAT(fecha, '%b %Y') as mes,
        COUNT(*) as cantidad 
      FROM reservas 
      WHERE fecha IS NOT NULL 
      GROUP BY mes_key, mes 
      ORDER BY mes_key ASC 
      LIMIT 12
    `).catch(() => []);

    // 3. Gráfico 2: Estados de las reservas (datos reales)
    const estadosRes = await p(`
      SELECT 
        CASE 
          WHEN LOWER(estado) IN ('confirmada', 'activa') THEN 'Confirmada'
          WHEN LOWER(estado) = 'realizada' THEN 'Realizada'
          WHEN LOWER(estado) = 'cancelada' THEN 'Cancelada'
          ELSE 'Pendiente'
        END as name,
        COUNT(*) as value
      FROM reservas
      GROUP BY name
    `).catch(() => []);

    // 4. Gráfico 3: Métodos de pago utilizados (datos reales)
    const metodosPagoRes = await p(`
      SELECT 
        COALESCE(NULLIF(TRIM(metodo_pago), ''), 'No especificado') as name,
        COUNT(*) as cantidad
      FROM reservas
      GROUP BY name
      ORDER BY cantidad DESC
    `).catch(() => []);

    // 5. Gráfico 4: Lugares más reservados (datos reales)
    const lugaresMasReservadosRes = await p(`
      SELECT 
        l.nombre, 
        COUNT(r.id) as reservas
      FROM lugares l
      INNER JOIN reservas r ON l.id = r.lugar_id
      GROUP BY l.id, l.nombre
      ORDER BY reservas DESC
      LIMIT 6
    `).catch(() => []);

    res.json({
      status: 'OK',
      data: {
        cards: {
          totalUsuarios: totalUsuariosRes[0]?.count || 0,
          totalReservas: totalReservasRes[0]?.count || 0,
          totalLugares: totalLugaresRes[0]?.count || 0,
          reservasPendientes: reservasPendientesRes[0]?.count || 0,
          reservasConfirmadas: reservasConfirmadasRes[0]?.count || 0,
          reservasCanceladas: reservasCanceladasRes[0]?.count || 0
        },
        charts: {
          reservasPorMes: reservasPorMesRes.map(r => ({ mes: r.mes, cantidad: Number(r.cantidad) })),
          estadoReservas: estadosRes.map(r => ({ name: r.name, value: Number(r.value) })),
          metodosPago: metodosPagoRes.map(r => ({
            name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
            cantidad: Number(r.cantidad)
          })),
          lugaresMasReservados: lugaresMasReservadosRes.map(r => ({
            nombre: r.nombre,
            reservas: Number(r.reservas)
          }))
        }
      }
    });

  } catch (err) {
    console.error("Error al obtener estadísticas del dashboard:", err);
    res.status(500).json({ status: 'ERROR', mensaje: err.sqlMessage || err.message });
  }
};

