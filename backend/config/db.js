const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error conexión a la base de datos:", err);
    return;
  }
  console.log("Conectado a la BD: emitours (usando connection pool)");

  // Asegurar eliminación de guia_id en reservas si aún existe
  connection.query("SHOW COLUMNS FROM reservas LIKE 'guia_id'", (errCol, resCol) => {
    if (!errCol && resCol && resCol.length > 0) {
      connection.query("ALTER TABLE reservas DROP COLUMN guia_id", (errDrop) => {
        if (!errDrop) console.log("Columna 'guia_id' eliminada de reservas.");
      });
    }
  });

  // Asegurar que estado_pago soporte 'pendiente', 'parcial', 'pagado'
  connection.query("ALTER TABLE reservas MODIFY COLUMN estado_pago ENUM('pendiente','parcial','pagado') NOT NULL DEFAULT 'pendiente'", (errMod) => {
    if (!errMod) console.log("Columna 'estado_pago' verificada.");
  });

  // Asegurar columnas requeridas en registro_usuarios
  const columnsToCheck = [
    { name: 'pais', def: "VARCHAR(100) NOT NULL DEFAULT 'Colombia'" },
    { name: 'tipo_documento', def: "VARCHAR(50) NOT NULL DEFAULT 'Cédula de ciudadanía'" },
    { name: 'email_verificado', def: "TINYINT(1) NOT NULL DEFAULT 1" },
    { name: 'codigo_recuperacion', def: "VARCHAR(10) NULL" },
    { name: 'codigo_recuperacion_expira', def: "DATETIME NULL" },
    { name: 'google_id', def: "VARCHAR(100) NULL UNIQUE" },
    { name: 'fecha_registro', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" }
  ];

  let completedCols = 0;
  columnsToCheck.forEach(col => {
    connection.query(`SHOW COLUMNS FROM registro_usuarios LIKE '${col.name}'`, (errCheck, resCheck) => {
      if (!errCheck && (!resCheck || resCheck.length === 0)) {
        connection.query(`ALTER TABLE registro_usuarios ADD COLUMN ${col.name} ${col.def}`, () => {
          completedCols++;
          if (completedCols === columnsToCheck.length) checkIndexes();
        });
      } else {
        completedCols++;
        if (completedCols === columnsToCheck.length) checkIndexes();
      }
    });
  });

  // Eliminar columnas obsoletas: codigo_verificacion, codigo_verificacion_expira, idioma y sexo
  connection.query("SHOW COLUMNS FROM registro_usuarios LIKE 'codigo_verificacion'", (errCol, resCol) => {
    if (!errCol && resCol && resCol.length > 0) {
      connection.query("ALTER TABLE registro_usuarios DROP COLUMN codigo_verificacion", () => {
        console.log("Columna obsoleta 'codigo_verificacion' eliminada de registro_usuarios.");
      });
    }
  });

  connection.query("SHOW COLUMNS FROM registro_usuarios LIKE 'codigo_verificacion_expira'", (errCol, resCol) => {
    if (!errCol && resCol && resCol.length > 0) {
      connection.query("ALTER TABLE registro_usuarios DROP COLUMN codigo_verificacion_expira", () => {
        console.log("Columna obsoleta 'codigo_verificacion_expira' eliminada de registro_usuarios.");
      });
    }
  });

  connection.query("SHOW COLUMNS FROM registro_usuarios LIKE 'idioma'", (errCol, resCol) => {
    if (!errCol && resCol && resCol.length > 0) {
      connection.query("ALTER TABLE registro_usuarios DROP COLUMN idioma", () => {
        console.log("Columna 'idioma' eliminada permanentemente de registro_usuarios.");
      });
    }
  });

  connection.query("SHOW COLUMNS FROM registro_usuarios LIKE 'sexo'", (errCol, resCol) => {
    if (!errCol && resCol && resCol.length > 0) {
      connection.query("ALTER TABLE registro_usuarios DROP COLUMN sexo", () => {
        console.log("Columna 'sexo' eliminada permanentemente de registro_usuarios.");
      });
    }
  });

  function checkIndexes() {
    // Asegurar índice único compuesto por (pais, tipo_documento, cedula)
    connection.query("SHOW INDEX FROM registro_usuarios WHERE Key_name = 'cedula'", (errIdx, resIdx) => {
      if (!errIdx && resIdx && resIdx.length > 0) {
        connection.query("ALTER TABLE registro_usuarios DROP INDEX cedula", () => {
          connection.query("ALTER TABLE registro_usuarios ADD UNIQUE KEY idx_pais_tipo_cedula (pais, tipo_documento, cedula)", () => {
            console.log("Índice compuesto (pais, tipo_documento, cedula) configurado.");
          });
        });
      } else {
        connection.query("SHOW INDEX FROM registro_usuarios WHERE Key_name = 'idx_pais_tipo_cedula'", (errIdx2, resIdx2) => {
          if (!errIdx2 && (!resIdx2 || resIdx2.length === 0)) {
            connection.query("ALTER TABLE registro_usuarios ADD UNIQUE KEY idx_pais_tipo_cedula (pais, tipo_documento, cedula)", () => {
              console.log("Índice compuesto (pais, tipo_documento, cedula) creado.");
            });
          }
        });
      }
    });
  }

  // ELIMINAR COMPLETAMENTE Y DE FORMA PERMANENTE LA TABLA registro_pendiente
  connection.query("DROP TABLE IF EXISTS registro_pendiente", (errDrop) => {
    if (!errDrop) {
      console.log("Tabla 'registro_pendiente' eliminada permanentemente del sistema.");
    } else {
      console.error("Error al eliminar 'registro_pendiente':", errDrop);
    }
  });

  connection.release();
});

module.exports = pool;