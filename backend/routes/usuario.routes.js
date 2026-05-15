const express = require('express');

const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');

// ================= LOGIN =================

router.post('/login', usuarioController.login);

// ================= CRUD =================

// GET todos
router.get('/', usuarioController.getAll);

// GET por ID
router.get('/:id', usuarioController.getById);

// POST
router.post('/', usuarioController.create);

// PUT
router.put('/:id', usuarioController.update);

// DELETE
router.delete('/:id', usuarioController.delete);

module.exports = router;