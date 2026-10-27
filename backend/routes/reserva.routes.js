const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const { verifyUserOrAdminToken } = require('../middlewares/authAdmin');

// 🔹 GET todas las reservas
router.get('/', reservaController.getAll);

// 🔹 POST crear reserva
router.post('/', reservaController.create);

// 🔹 PUT cancelar reserva por el usuario propietario
router.put('/:id/cancelar', verifyUserOrAdminToken, reservaController.cancelarReserva);

// 🔹 PUT actualizar reserva
router.put('/:id', reservaController.update);

// 🔹 DELETE eliminar reserva
router.delete('/:id', reservaController.delete);

module.exports = router;