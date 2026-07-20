// Controlador HTTP del dashboard de estadísticas.
const service = require('./stats.service');

async function stats(_req, res, next) {
  try {
    res.status(200).json(await service.obtenerStats());
  } catch (err) {
    next(err);
  }
}

module.exports = { stats };
