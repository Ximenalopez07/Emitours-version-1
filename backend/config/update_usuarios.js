const db = require('./db');

// Obtener las columnas existentes de la tabla registro_usuarios
db.query("SHOW COLUMNS FROM registro_usuarios", (err, columns) => {
  if (err) {
    console.error("Error al obtener columnas de registro_usuarios:", err);
    process.exit(1);
  }

  const columnNames = columns.map(c => c.Field.toLowerCase());
  const queries = [];
  
  if (!columnNames.includes('telefono')) {
    queries.push("ALTER TABLE registro_usuarios ADD COLUMN telefono VARCHAR(20) DEFAULT NULL");
  } else {
    console.log("Columna 'telefono' ya existe.");
  }

  if (!columnNames.includes('foto')) {
    queries.push("ALTER TABLE registro_usuarios ADD COLUMN foto TEXT DEFAULT NULL");
  } else {
    console.log("Columna 'foto' ya existe.");
  }

  if (queries.length === 0) {
    console.log("El esquema de la tabla registro_usuarios ya está actualizado.");
    db.end();
    process.exit(0);
  }

  let completed = 0;
  queries.forEach(query => {
    db.query(query, (err) => {
      if (err) {
        console.error("Error al ejecutar query:", query, err);
        process.exit(1);
      }
      completed++;
      if (completed === queries.length) {
        console.log("Esquema de la tabla registro_usuarios actualizado exitosamente (teléfono y foto agregados).");
        db.end();
        process.exit(0);
      }
    });
  });
});
