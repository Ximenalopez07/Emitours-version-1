const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

async function checkRecentReservas() {
  const [rows] = await db.promise().query(
    "SELECT id, codigo, usuario_id, lugar_id, metodo_pago, estado, estado_pago, mp_payment_id, monto_pagado, precio_total, fecha FROM reservas ORDER BY id DESC LIMIT 5"
  );
  console.log('Últimas 5 reservas en la Base de Datos:');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

checkRecentReservas();
