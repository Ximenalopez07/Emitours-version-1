const db = require('./config/db');

async function updateSchema() {
  console.log('Iniciando actualización de esquema para Reservas, Contacto y ChatBot IA...');

  // 1. Modificar tabla lugares para incluir cupos_disponibles, capacidad_maxima, horarios, etc.
  const lugaresCols = await new Promise((res, rej) => db.query('DESCRIBE lugares', (err, r) => err ? rej(err) : res(r)));
  const lCols = lugaresCols.map(c => c.Field);

  if (!lCols.includes('cupos_disponibles')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN cupos_disponibles INT DEFAULT 20', (e, r) => e ? rej(e) : res(r)));
  if (!lCols.includes('capacidad_maxima')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN capacidad_maxima INT DEFAULT 20', (e, r) => e ? rej(e) : res(r)));
  if (!lCols.includes('horarios_disponibles')) await new Promise((res, rej) => db.query('ALTER TABLE lugares ADD COLUMN horarios_disponibles JSON', (e, r) => e ? rej(e) : res(r)));

  // Actualizar valores por defecto para horarios en lugares
  await new Promise((res, rej) => db.query(`UPDATE lugares SET horarios_disponibles = '["08:00 AM", "10:00 AM", "02:00 PM", "04:00 PM"]' WHERE horarios_disponibles IS NULL`, (e, r) => e ? rej(e) : res(r)));

  // 2. Modificar tabla reservas
  const reservasCols = await new Promise((res, rej) => db.query('DESCRIBE reservas', (err, r) => err ? rej(err) : res(r)));
  const rCols = reservasCols.map(c => c.Field);

  if (!rCols.includes('nombre_completo')) await new Promise((res, rej) => db.query('ALTER TABLE reservas ADD COLUMN nombre_completo VARCHAR(150)', (e, r) => e ? rej(e) : res(r)));
  if (!rCols.includes('celular')) await new Promise((res, rej) => db.query('ALTER TABLE reservas ADD COLUMN celular VARCHAR(30)', (e, r) => e ? rej(e) : res(r)));

  // 3. Crear tabla mensajes_contacto
  await new Promise((res, rej) => db.query(`
    CREATE TABLE IF NOT EXISTS mensajes_contacto (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT,
      nombre VARCHAR(150) NOT NULL,
      asunto VARCHAR(200) NOT NULL,
      mensaje TEXT NOT NULL,
      estado ENUM('Pendiente', 'Respondido') DEFAULT 'Pendiente',
      respuesta_admin TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (e, r) => e ? rej(e) : res(r)));

  // 4. Crear tabla chatbot_conversaciones
  await new Promise((res, rej) => db.query(`
    CREATE TABLE IF NOT EXISTS chatbot_conversaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      mensaje_usuario TEXT NOT NULL,
      respuesta_ia TEXT NOT NULL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (e, r) => e ? rej(e) : res(r)));

  // 5. Crear tabla chatbot_config
  await new Promise((res, rej) => db.query(`
    CREATE TABLE IF NOT EXISTS chatbot_config (
      id INT PRIMARY KEY DEFAULT 1,
      activo TINYINT(1) DEFAULT 1,
      mensaje_bienvenida TEXT,
      faq JSON
    )
  `, (e, r) => e ? rej(e) : res(r)));

  await new Promise((res, rej) => db.query(`
    INSERT IGNORE INTO chatbot_config (id, activo, mensaje_bienvenida)
    VALUES (1, 1, '¡Hola! Soy el Asistente Virtual IA de EmiTours. ¿En qué te puedo ayudar hoy?')
  `, (e, r) => e ? rej(e) : res(r)));

  console.log('✅ ESQUEMA DE BASE DE DATOS ACTUALIZADO CORRECTAMENTE');
  process.exit();
}

updateSchema().catch(e => {
  console.error('❌ ERROR AL ACTUALIZAR ESQUEMA:', e);
  process.exit(1);
});
