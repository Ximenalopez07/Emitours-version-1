const express = require('express');
const cors = require('cors');

const app = express();

// ================= MIDDLEWARES =================

app.use(cors());
app.use(express.json());

// ================= IMPORTAR RUTAS =================

const usuarioRoutes = require('./routes/usuario.routes');
const reservaRoutes = require('./routes/reserva.routes');

// ================= USAR RUTAS =================

app.use('/usuarios', usuarioRoutes);
app.use('/reservas', reservaRoutes);

// ================= RUTA BASE =================

app.get('/', (req, res) => {
  res.send('API funcionando');
});

// ================= LEVANTAR SERVIDOR =================

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});