const express = require('express');
const router = express.Router();
const adminAuth = require('../controllers/adminAuth.controller');
const adminStats = require('../controllers/adminStats.controller');
const adminCrud = require('../controllers/adminCrud.controller');
const { verifyAdminToken, requireSuperAdmin } = require('../middlewares/authAdmin');

// Rutas Públicas de Admin
router.post('/auth/login', adminAuth.login);
router.post('/auth/forgot', adminAuth.forgotPassword);

// Middleware Global de Protección para todo el panel
router.use(verifyAdminToken);

// Verificación de Sesión
router.get('/auth/verify', adminAuth.verifySession);

// Métricas y Estadísticas Dashboard
router.get('/stats', adminStats.getDashboardStats);

// Gestión de Usuarios (Clientes)
router.get('/usuarios', adminCrud.getUsuarios);
router.put('/usuarios/:id', adminCrud.updateUsuarioAdmin);

// Gestión de Administradores (Super Admin requerido)
router.get('/administradores', adminCrud.getAdministradores);
router.post('/administradores', requireSuperAdmin, adminCrud.createAdministrador);
router.put('/administradores/:id', requireSuperAdmin, adminCrud.updateAdministrador);
router.delete('/administradores/:id', requireSuperAdmin, adminCrud.deleteAdministrador);

// Gestión de Lugares
router.get('/lugares', adminCrud.getLugaresAdmin);
router.post('/lugares', adminCrud.createLugarAdmin);
router.put('/lugares/:id', adminCrud.updateLugarAdmin);
router.delete('/lugares/:id', adminCrud.deleteLugarAdmin);

// Gestión de Categorías
router.get('/categorias', adminCrud.getCategorias);
router.post('/categorias', adminCrud.createCategoria);
router.put('/categorias/:id', adminCrud.updateCategoria);
router.delete('/categorias/:id', adminCrud.deleteCategoria);

// Gestión de Reservas
router.get('/reservas', adminCrud.getReservasAdmin);
router.put('/reservas/:id/estado', adminCrud.updateReservaStatus);

// Gestión de Pagos
router.get('/pagos', adminCrud.getPagosAdmin);

// Gestión de Comentarios y Moderación
router.get('/comentarios', adminCrud.getComentariosAdmin);
router.put('/comentarios/:id', adminCrud.updateComentarioState);

// Promociones y Noticias
router.get('/promociones', adminCrud.getPromocionesAdmin);
router.post('/promociones', adminCrud.createPromocionAdmin);

// Configuración del Sitio
router.get('/configuracion', adminCrud.getConfiguracion);
router.put('/configuracion', adminCrud.updateConfiguracion);

// Notificaciones en tiempo real
router.get('/notificaciones', adminCrud.getNotificaciones);

module.exports = router;
