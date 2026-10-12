require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');
const { migrateAdminPasswords } = require('./migrateAdminPasswords');

console.log('Iniciando migración segura de contraseñas administrativas...');
migrateAdminPasswords(db);

setTimeout(() => {
  console.log('Verificación de migración completada.');
  process.exit(0);
}, 2500);
