const Reserva = require('../models/reserva.model');

// GET todas las reservas
exports.getAll = (req, res) => {

  Reserva.getAll((err, result) => {

    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener reservas",
        error: err.message
      });
    }

    res.json({
      ok: true,
      data: result
    });

  });

};

// POST crear reserva
exports.create = (req, res) => {

  const {
    usuario_id,
    fecha,
    hora,
    numero_personas,
    estado
  } = req.body;

  // VALIDACIÓN
  if (!usuario_id || !fecha || !hora) {

    return res.status(400).json({
      ok: false,
      mensaje: "Faltan campos obligatorios"
    });

  }

  Reserva.create(req.body, (err, result) => {

    if (err) {

      return res.status(500).json({
        ok: false,
        mensaje: "Error al crear reserva",
        error: err.message
      });

    }

    res.status(201).json({
      ok: true,
      mensaje: "Reserva creada",
      id: result.insertId
    });

  });

};

// PUT actualizar reserva
exports.update = (req, res) => {

  const { id } = req.params;

  const {
    numero_personas,
    estado
  } = req.body;

  // VALIDACIÓN
  if (!numero_personas) {

    return res.status(400).json({
      ok: false,
      mensaje: "Debe indicar número de personas"
    });

  }

  Reserva.update(id, req.body, (err) => {

    if (err) {

      return res.status(500).json({
        ok: false,
        mensaje: "Error al actualizar reserva",
        error: err.message
      });

    }

    res.json({
      ok: true,
      mensaje: "Reserva actualizada"
    });

  });

};

// DELETE eliminar reserva
exports.delete = (req, res) => {

  const { id } = req.params;

  Reserva.delete(id, (err) => {

    if (err) {

      return res.status(500).json({
        ok: false,
        mensaje: "Error al eliminar reserva",
        error: err.message
      });

    }

    res.json({
      ok: true,
      mensaje: "Reserva eliminada"
    });

  });

};