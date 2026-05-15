const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');

// 🔹 GET todas las reservas
router.get('/', reservaController.getAll);

// 🔹 POST crear reserva
router.post('/', reservaController.create);

// 🔹 PUT actualizar reserva
router.put('/:id', reservaController.update);

// 🔹 DELETE eliminar reserva
router.delete('/:id', reservaController.delete);

module.exports = router;