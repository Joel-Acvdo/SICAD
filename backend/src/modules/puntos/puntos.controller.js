// Controladores HTTP del módulo de puntos de acceso.
const service = require('./puntos.service');

async function listar(_req, res, next) {
  try {
    res.status(200).json({ puntos: await service.listar() });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
