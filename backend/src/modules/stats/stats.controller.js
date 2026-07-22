// Controlador HTTP del dashboard de estadísticas.
const service = require('./stats.service');

async function stats(req, res, next) {
  try {
    // Rango de fechas opcional (?desde=&hasta=) para las métricas de accesos.
    res.status(200).json(await service.obtenerStats({ desde: req.query.desde, hasta: req.query.hasta }));
  } catch (err) {
    next(err);
  }
}

module.exports = { stats };
