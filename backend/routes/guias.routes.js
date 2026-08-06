const express = require('express');
const router = express.Router();
const guiasController = require('../controllers/guias.controller');

router.get('/', guiasController.getAll);
router.get('/:id', guiasController.getById);

module.exports = router;
