const express = require('express');
const cors = require('cors');

const app = express();

// ================= MIDDLEWARES =================

app.use(cors());
app.use(express.json());

// ================= IMPORTAR RUTAS =================

const usuarioRoutes = require('./routes/usuario.routes');
const reservaRoutes = require('./routes/reserva.routes');
const lugaresRoutes = require('./routes/lugares.routes');
const guiasRoutes = require('./routes/guias.routes');
const adminRoutes = require('./routes/admin.routes');
const contactoRoutes = require('./routes/contacto.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

// ================= USAR RUTAS =================

app.use('/usuarios', usuarioRoutes);
app.use('/reservas', reservaRoutes);
app.use('/lugares', lugaresRoutes);
app.use('/guias', guiasRoutes);
app.use('/admin', adminRoutes);
app.use('/contacto', contactoRoutes);
app.use('/chatbot', chatbotRoutes);

// ================= RUTA BASE =================

app.get('/', (req, res) => {
  res.send('API funcionando');
});

// ================= LEVANTAR SERVIDOR =================

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});