const db = require('./db');

const createTableSql = `
  CREATE TABLE IF NOT EXISTS lugares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    imagen VARCHAR(1000) NOT NULL
  )
`;

const lugaresData = [
  {
    nombre: "Pablo Escobar",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlnxh8O5vDMUrQWb0J8T-WDK-yHu9q_DHWZg&s",
    descripcion: 'Usando dinero del narcotráfico y con sus aspiraciones políticas y criminales presentes, Pablo Escobar decidió ofrecer "casas gratis" a sin-techos y los más pobres de Medellín al ordenar la construcción inicial de 250 casas para familias que vivían en el basurero municipal. El Gobierno Nacional ordenó demolerlas al saber que provenían del narcotráfico.'
  },
  {
    nombre: "Comuna 13",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJFj3Gneuspnt1RUvzE8zelO98GAvkhGw1sg&s",
    descripcion: "La Comuna 13 es un ejemplo emblemático de transformación social, arte urbano, cultura y comunidad. Graffitis, escaleras eléctricas y música hacen del lugar un símbolo de resiliencia y turismo."
  },
  {
    nombre: "Guatapé",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9f2DxLn5Q8C_wFSmTg8iUxq1lQd6KlxbsAg&s",
    descripcion: 'Guatapé, conocido como "el pueblo de los zócalos", mezcla tradición indígena con modernidad. Con el embalse construido en los años 70, se convirtió en un destino turístico fundamental.'
  },
  {
    nombre: "Pueblito Paisa",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSw4ZCUmpQS_mT3D5EqAIVMapoqLZ83EcSuA&s",
    descripcion: "Réplica de un pueblo tradicional antioqueño, ubicado en el Cerro Nutibara. Es un sitio histórico y turístico que mezcla cultura, gastronomía y tradición."
  },
  {
    nombre: "City Tour",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzZTpJR8aQt929h3wrN543y_gDCQxczoTRmA&s",
    descripcion: "El centro de Medellín es un lugar lleno de historia, arte, comercio y cultura. Es un espacio donde se vive el ritmo auténtico de la ciudad."
  },
  {
    nombre: "Metro Cable",
    imagen: "https://getvico.com/blog/wp-content/uploads/2018/01/Metrocable.jpg",
    descripcion: "La experiencia de montar en Metro Cable es única: permite ver la ciudad desde las alturas mientras asciendes por las montañas que rodean Medellín. Es tranquilo, panorámico y una de las mejores formas de entender cómo la movilidad transformó a la comunidad."
  }
];

// Ejecutar la creación de la tabla
db.query(createTableSql, (err) => {
  if (err) {
    console.error("Error al crear la tabla 'lugares':", err);
    process.exit(1);
  }
  console.log("Tabla 'lugares' verificada/creada correctamente.");

  // Comprobar si ya existen registros en la tabla
  db.query("SELECT COUNT(*) as count FROM lugares", (err, result) => {
    if (err) {
      console.error("Error al verificar los registros existentes:", err);
      process.exit(1);
    }

    const count = result[0].count;
    if (count > 0) {
      console.log("La tabla 'lugares' ya tiene registros. Omitiendo la siembra para no duplicar datos.");
      db.end();
      process.exit(0);
    } else {
      // Insertar los lugares de forma masiva
      const insertSql = "INSERT INTO lugares (nombre, descripcion, imagen) VALUES ?";
      const values = lugaresData.map(l => [l.nombre, l.descripcion, l.imagen]);

      db.query(insertSql, [values], (err) => {
        if (err) {
          console.error("Error al sembrar los lugares:", err);
          process.exit(1);
        }
        console.log("¡Siembra exitosa! Se insertaron los lugares correctamente.");
        db.end();
        process.exit(0);
      });
    }
  });
});
