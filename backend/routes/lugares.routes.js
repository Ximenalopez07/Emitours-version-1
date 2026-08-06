const express = require('express');
const router = express.Router();
const lugaresController = require('../controllers/lugares.controller');

// GET todos los lugares
router.get('/', lugaresController.getAll);

module.exports = router;
