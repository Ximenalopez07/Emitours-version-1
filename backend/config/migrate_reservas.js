const db = require('./db');
const fs = require('fs');
const path = require('path');

function formatTimeToSql(hStr) {
  if (!hStr) return '07:00:00';
  const clean = hStr.trim();
  if (clean.includes('AM') || clean.includes('PM')) {
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const mAndPeriod = parts[1].split(' ');
    let m = parseInt(mAndPeriod[0], 10) || 0;
    const period = mAndPeriod[1] ? mAndPeriod[1].toUpperCase() : 'AM';
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseInt(match[3] || '0', 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return '07:00:00';
}

function normalizeMetodoPago(mp) {
  if (!mp) return 'nequi';
  const val = String(mp).toLowerCase();
  if (val.includes('nequi')) return 'nequi';
  if (val.includes('pse')) return 'pse';
  if (val.includes('efectivo')) return 'efectivo';
  if (val.includes('dataf') || val.includes('datáf')) return 'datafono';
  return 'nequi';
}

function normalizeEstadoPago(ep) {
  if (!ep) return 'pendiente';
  const val = String(ep).toLowerCase();
  if (val.includes('pagad')) return 'pagado';
  return 'pendiente';
}

function normalizeEstado(st) {
  if (!st) return 'pendiente';
  const val = String(st).toLowerCase();
  if (val.includes('confir') || val.includes('activa')) return 'confirmada';
  if (val.includes('cancel')) return 'cancelada';
  return 'pendiente';
}

async function runMigration() {
  const p = (sql, params = []) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });

  try {
    console.log('1. Obteniendo datos actuales de reservas para respaldo...');
    const existingRows = await p('SELECT * FROM reservas');
    const backupPath = path.join(__dirname, `backup_reservas_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(existingRows, null, 2), 'utf-8');
    console.log(`Respaldo guardado en ${backupPath} con ${existingRows.length} registros.`);

    console.log('2. Creando tabla temporal reservas_backup en MySQL...');
    await p('CREATE TABLE IF NOT EXISTS reservas_backup_seguridad AS SELECT * FROM reservas');

    console.log('3. Creando tabla reservas_nueva con exactamente 13 campos...');
    await p('DROP TABLE IF EXISTS reservas_nueva');
    await p(`
      CREATE TABLE reservas_nueva (
        id INT NOT NULL AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        lugar_id INT NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        numero_personas INT NOT NULL,
        idioma ENUM('es', 'en') NOT NULL,
        precio_total DECIMAL(10, 2) NOT NULL,
        metodo_pago ENUM('nequi', 'pse', 'efectivo', 'datafono') NOT NULL,
        estado_pago ENUM('pendiente', 'pagado') NOT NULL DEFAULT 'pendiente',
        estado ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
        codigo VARCHAR(30) NOT NULL UNIQUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id) REFERENCES registro_usuarios (id_registro) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_reservas_lugar FOREIGN KEY (lugar_id) REFERENCES lugares (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('4. Migrando registros existentes a reservas_nueva...');
    for (const row of existingRows) {
      const fechaStr = row.fecha instanceof Date ? row.fecha.toISOString().split('T')[0] : String(row.fecha).substring(0, 10);
      const horaSql = formatTimeToSql(row.hora);
      const idiomaEnum = (row.idioma && String(row.idioma).toLowerCase() === 'en') ? 'en' : 'es';
      const precioTotal = parseFloat(row.precio_total) || 150000.00;
      const metodoPagoEnum = normalizeMetodoPago(row.metodo_pago);
      const estadoPagoEnum = normalizeEstadoPago(row.estado_pago);
      const estadoEnum = normalizeEstado(row.estado);
      const codigo = row.codigo || `RES-${row.id}`;

      await p(`
        INSERT INTO reservas_nueva (
          id,
          usuario_id,
          lugar_id,
          fecha,
          hora,
          numero_personas,
          idioma,
          precio_total,
          metodo_pago,
          estado_pago,
          estado,
          codigo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        row.id,
        row.usuario_id,
        row.lugar_id,
        fechaStr,
        horaSql,
        row.numero_personas,
        idiomaEnum,
        precioTotal,
        metodoPagoEnum,
        estadoPagoEnum,
        estadoEnum,
        codigo
      ]);
    }

    console.log('5. Reemplazando tabla reservas por reservas_nueva...');
    await p('DROP TABLE IF EXISTS reservas');
    await p('RENAME TABLE reservas_nueva TO reservas');

    console.log('6. Verificando estructura final de reservas:');
    const desc = await p('DESCRIBE reservas');
    console.table(desc);

    console.log('7. Verificando registros en reservas:');
    const finalData = await p('SELECT * FROM reservas');
    console.table(finalData);

    console.log('¡Migración de tabla reservas completada con éxito!');
    process.exit(0);
  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(1);
  }
}

runMigration();
