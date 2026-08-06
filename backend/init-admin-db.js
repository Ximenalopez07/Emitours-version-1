const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function setupDB() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS administradores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) NOT NULL,
      documento VARCHAR(30) UNIQUE,
      correo VARCHAR(100) NOT NULL UNIQUE,
      contrasena VARCHAR(255) NOT NULL,
      telefono VARCHAR(20),
      rol ENUM('Super Administrador', 'Administrador') DEFAULT 'Administrador',
      estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
      foto VARCHAR(255),
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categorias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE,
      descripcion TEXT,
      icono VARCHAR(50) DEFAULT 'FaMapMarkerAlt',
      estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo'
    )`,
    `CREATE TABLE IF NOT EXISTS pagos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reserva_id INT,
      monto DECIMAL(10,2) NOT NULL,
      metodo_pago VARCHAR(50) DEFAULT 'Tarjeta / PSE',
      estado ENUM('Pagado', 'Pendiente', 'Reembolsado') DEFAULT 'Pagado',
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      comprobante VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS comentarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT,
      lugar_id INT,
      comentario TEXT NOT NULL,
      calificacion INT DEFAULT 5,
      estado ENUM('Aprobado', 'Pendiente', 'Oculto') DEFAULT 'Aprobado',
      respuesta_admin TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS noticias_promociones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo ENUM('Noticia', 'Promocion') NOT NULL DEFAULT 'Promocion',
      titulo VARCHAR(150) NOT NULL,
      descripcion TEXT,
      descuento_porcentaje INT DEFAULT 0,
      cupon VARCHAR(50),
      fecha_inicio DATE,
      fecha_fin DATE,
      estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo'
    )`,
    `CREATE TABLE IF NOT EXISTS configuracion_sitio (
      id INT PRIMARY KEY DEFAULT 1,
      nombre_sitio VARCHAR(100) DEFAULT 'EmiTours',
      logo VARCHAR(255),
      favicon VARCHAR(255),
      correo VARCHAR(100) DEFAULT 'contacto@emitours.com',
      telefono VARCHAR(20) DEFAULT '+57 300 000 0000',
      redes_sociales JSON,
      direccion VARCHAR(200) DEFAULT 'Medellín, Antioquia, Colombia',
      mapa_url TEXT,
      colores JSON,
      modo_defecto VARCHAR(20) DEFAULT 'dark'
    )`,
    `CREATE TABLE IF NOT EXISTS notificaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      mensaje TEXT NOT NULL,
      leido TINYINT(1) DEFAULT 0,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (let q of queries) {
    await new Promise((res, rej) => db.query(q, (err, r) => err ? rej(err) : res(r)));
  }

  // Verificar columnas en lugares
  const lugaresCols = await new Promise((res, rej) => db.query('DESCRIBE lugares', (err, r) => err ? rej(err) : res(r)));
  const colNames = lugaresCols.map(c => c.Field);
  
  if (!colNames.includes('precio')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN precio DECIMAL(10,2) DEFAULT 100000', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('ubicacion')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN ubicacion VARCHAR(150) DEFAULT \'Medellín\'', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('categoria_id')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN categoria_id INT DEFAULT 1', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('duracion')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN duracion VARCHAR(50) DEFAULT \'4 Horas\'', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('capacidad')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN capacidad INT DEFAULT 20', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('estado')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN estado ENUM(\'Activo\', \'Inactivo\') DEFAULT \'Activo\'', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('galeria')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN galeria JSON', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('servicios')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN servicios TEXT', (e, r) => e ? rej(e) : res(r)));
  if (!colNames.includes('calificacion')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN calificacion DECIMAL(2,1) DEFAULT 4.8', (e, r) => e ? rej(e) : res(r)));

  // Verificar columnas en reservas
  const reservasCols = await new Promise((res, rej) => db.query('DESCRIBE reservas', (err, r) => err ? rej(err) : res(r)));
  const rColNames = reservasCols.map(c => c.Field);
  if (!rColNames.includes('codigo')) await new Promise((res, rej) => db.query('ALTER TABLE reservas ADD COLUMN codigo VARCHAR(50) UNIQUE', (e, r) => e ? rej(e) : res(r)));
  if (!rColNames.includes('lugar_id')) await new Promise((res, rej) => db.query('ALTER TABLE reservas ADD COLUMN lugar_id INT DEFAULT 1', (e, r) => e ? rej(e) : res(r)));
  if (!rColNames.includes('precio_total')) await new Promise((res, rej) => db.query('ALTER TABLE reservas ADD COLUMN precio_total DECIMAL(10,2) DEFAULT 150000', (e, r) => e ? rej(e) : res(r)));
  if (!rColNames.includes('metodo_pago')) await new Promise((res, rej) => db.query('ALTER TABLE reservas ADD COLUMN metodo_pago VARCHAR(50) DEFAULT \'PSE\'', (e, r) => e ? rej(e) : res(r)));
  if (!rColNames.includes('admin_responsable_id')) await new Promise((res, rej) => db.query('ALTER TABLE reservas ADD COLUMN admin_responsable_id INT', (e, r) => e ? rej(e) : res(r)));

  // Asignar códigos a reservas existentes si faltan
  await new Promise((res, rej) => db.query(`UPDATE reservas SET codigo = CONCAT('RES-', id, '-', FLOOR(1000 + RAND() * 9000)) WHERE codigo IS NULL`, (e, r) => e ? rej(e) : res(r)));

  // Sembrar Categorías iniciales
  const cats = [
    ['Cultura', 'Recorridos culturales e históricos', 'FaLandmark', 'Activo'],
    ['Aventura', 'Experiencias extremas y caminatas', 'FaCompass', 'Activo'],
    ['Naturaleza', 'Paisajes y bosques', 'FaTree', 'Activo'],
    ['Gastronomía', 'Comida típica colombiana', 'FaUtensils', 'Activo'],
    ['Ecoturismo', 'Turismo ecológico', 'FaLeaf', 'Activo'],
    ['Nocturno', 'Eventos y vida nocturna', 'FaMoon', 'Activo']
  ];
  await new Promise((res, rej) => db.query('INSERT IGNORE INTO categorias (nombre, descripcion, icono, estado) VALUES ?', [cats], (e, r) => e ? rej(e) : res(r)));

  // Sembrar Administrador por defecto (admin@emitours.com / Admin123*)
  const hashed = await bcrypt.hash('Admin123*', 10);
  const adminSql = `INSERT INTO administradores (nombre, apellido, documento, correo, contrasena, telefono, rol, estado)
                    VALUES ('Super', 'Admin', '10000000', 'admin@emitours.com', ?, '3001234567', 'Super Administrador', 'Activo')
                    ON DUPLICATE KEY UPDATE contrasena = ?`;
  await new Promise((res, rej) => db.query(adminSql, [hashed, hashed], (e, r) => e ? rej(e) : res(r)));

  // Sembrar Configuración por defecto
  const configSql = `INSERT IGNORE INTO configuracion_sitio (id, nombre_sitio, correo, telefono, direccion) 
                    VALUES (1, 'EmiTours Medellín', 'contacto@emitours.com', '+57 300 123 4567', 'Medellín, Colombia')`;
  await new Promise((res, rej) => db.query(configSql, (e, r) => e ? rej(e) : res(r)));

  // Sembrar algunos pagos simulados basados en reservas
  await new Promise((res, rej) => db.query(`INSERT IGNORE INTO pagos (id, reserva_id, monto, metodo_pago, estado) VALUES 
    (1, 3, 150000, 'Tarjeta de Crédito', 'Pagado'),
    (2, 4, 150000, 'PSE', 'Pagado'),
    (3, 5, 350000, 'Nequi / Bancolombia', 'Pagado'),
    (4, 6, 50000, 'Efectivo', 'Pendiente')`, (e, r) => e ? rej(e) : res(r)));

  console.log('✅ BASE DE DATOS ESTRUCTURADA CORRECTAMENTE');
  process.exit();
}

setupDB().catch(e => { console.error('❌ ERROR AL CONFIGURAR BD:', e); process.exit(1); });
