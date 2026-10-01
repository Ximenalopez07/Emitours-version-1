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

  // Asegurar columnas para País, Tipo de Documento, Verificación de Correo y Recuperación de Contraseña
  const columnsToCheck = [
    { name: 'pais', def: "VARCHAR(100) NOT NULL DEFAULT 'Colombia'" },
    { name: 'tipo_documento', def: "VARCHAR(50) NOT NULL DEFAULT 'Cédula de ciudadanía'" },
    { name: 'email_verificado', def: "TINYINT(1) NOT NULL DEFAULT 1" },
    { name: 'codigo_verificacion', def: "VARCHAR(10) NULL" },
    { name: 'codigo_verificacion_expira', def: "DATETIME NULL" },
    { name: 'codigo_recuperacion', def: "VARCHAR(10) NULL" },
    { name: 'codigo_recuperacion_expira', def: "DATETIME NULL" },
    { name: 'google_id', def: "VARCHAR(100) NULL UNIQUE" }
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

  // Asegurar tabla registro_pendiente para verificación previa de cuentas
  connection.query(`
    CREATE TABLE IF NOT EXISTS registro_pendiente (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_usuario VARCHAR(100) NOT NULL,
      edad INT DEFAULT 18,
      sexo VARCHAR(50) DEFAULT 'Otro',
      pais VARCHAR(100) NOT NULL DEFAULT 'Colombia',
      tipo_documento VARCHAR(50) NOT NULL DEFAULT 'Cédula de ciudadanía',
      cedula VARCHAR(50) NOT NULL,
      telefono VARCHAR(50) NULL,
      correo_electronico VARCHAR(150) NOT NULL UNIQUE,
      contrasena VARCHAR(255) NOT NULL,
      codigo_verificacion VARCHAR(10) NOT NULL,
      codigo_expira DATETIME NOT NULL,
      intentos INT NOT NULL DEFAULT 0,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (errPend) => {
    if (!errPend) console.log("Tabla 'registro_pendiente' verificada.");
    else console.error("Error al verificar tabla 'registro_pendiente':", errPend);
  });

  connection.release();
});

module.exports = pool;