require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const testCases = [
  { correo: 'helenhenao8@gmail.com', pass: 'helen01234*' },
  { correo: 'ximena@gmail.com', pass: 'Ximena07*' },
  { correo: 'admin@emitours.com', pass: 'Admin123*' }
];

console.log('Verificando comparación de contraseñas con bcrypt.compare()...');

db.query("SELECT id_registro, correo_electronico, contrasena FROM registro_usuarios WHERE rol = 'admin'", async (err, admins) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }

  let allOk = true;
  for (const tc of testCases) {
    const admin = admins.find(a => a.correo_electronico === tc.correo);
    if (!admin) {
      console.error(`ADMIN NO ENCONTRADO: ${tc.correo}`);
      allOk = false;
      continue;
    }

    const isMatch = await bcrypt.compare(tc.pass, admin.contrasena);
    const wrongMatch = await bcrypt.compare('WrongPassword999*', admin.contrasena);
    const hashFormatValid = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(admin.contrasena);

    console.log(`- Admin ID ${admin.id_registro} (${tc.correo}):`);
    console.log(`  * Formato hash bcrypt válido: ${hashFormatValid}`);
    console.log(`  * Coincide con contraseña vigente: ${isMatch}`);
    console.log(`  * Rechaza contraseña incorrecta: ${!wrongMatch}`);

    if (!isMatch || wrongMatch || !hashFormatValid) {
      allOk = false;
    }
  }

  console.log(`\nResultado general de verificación: ${allOk ? 'TODO CORRECTO' : 'FALLOS DETECTADOS'}`);
  process.exit(allOk ? 0 : 1);
});
