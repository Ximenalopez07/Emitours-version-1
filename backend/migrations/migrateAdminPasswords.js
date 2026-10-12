const bcrypt = require('bcryptjs');

/**
 * Migración segura de contraseñas administrativas a hash bcrypt.
 * - Detecta si la contraseña está en texto plano.
 * - Si ya está hasheada con bcrypt, NO la vuelve a hashear.
 * - Conserva el id, correo y el valor exacto de la credencial existente.
 * - Nunca muestra contraseñas en texto plano en los logs.
 */
function migrateAdminPasswords(pool) {
  const query = "SELECT id_registro, correo_electronico, contrasena FROM registro_usuarios WHERE rol = 'admin'";
  
  pool.query(query, async (err, admins) => {
    if (err) {
      console.error('[Migración Admin] Error al consultar administradores:', err.message);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('[Migración Admin] No se encontraron administradores para verificar.');
      return;
    }

    const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

    for (const admin of admins) {
      const { id_registro, correo_electronico, contrasena } = admin;

      if (!contrasena) {
        console.warn(`[Migración Admin] El administrador ID ${id_registro} (${correo_electronico}) no tiene contraseña definida.`);
        continue;
      }

      const isBcrypt = bcryptRegex.test(contrasena);

      if (isBcrypt) {
        // Ya está protegida con bcrypt; no volver a aplicar hash
        console.log(`[Migración Admin] Administrador ID ${id_registro} (${correo_electronico}) ya cuenta con contraseña en hash bcrypt seguro.`);
      } else {
        // Está en texto plano: migrar de forma segura
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(contrasena, salt);

          pool.query(
            "UPDATE registro_usuarios SET contrasena = ? WHERE id_registro = ? AND rol = 'admin'",
            [hashedPassword, id_registro],
            (updateErr) => {
              if (updateErr) {
                console.error(`[Migración Admin] Error al actualizar hash para ID ${id_registro}:`, updateErr.message);
              } else {
                console.log(`[Migración Admin] Contraseña migrada exitosamente a hash seguro para ID ${id_registro} (${correo_electronico}).`);
              }
            }
          );
        } catch (hashError) {
          console.error(`[Migración Admin] Error al generar hash para ID ${id_registro}:`, hashError.message);
        }
      }
    }
  });
}

module.exports = { migrateAdminPasswords };
