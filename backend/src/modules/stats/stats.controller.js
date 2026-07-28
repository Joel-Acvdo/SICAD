// Controlador HTTP del dashboard de estadísticas.
const service = require('./stats.service');
const { validarRango } = require('../../utils/fechas');

async function stats(req, res, next) {
  try {
    // Rango de fechas opcional (?desde=&hasta=) para las métricas de accesos.
    // Se valida el formato: una fecha inválida devuelve 400 y no un 500.
    const rango = validarRango(req.query.desde, req.query.hasta);
    res.status(200).json(await service.obtenerStats(rango));
  } catch (err) {
    next(err);
  }
}

module.exports = { stats };
