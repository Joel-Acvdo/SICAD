// Controladores HTTP del módulo de accesos (bitácora).
const service = require('./accesos.service');

async function listar(req, res, next) {
  try {
    const filtro = {};
    if (req.query.id_usuario) filtro.id_usuario = Number(req.query.id_usuario);
    if (req.query.desde) filtro.desde = req.query.desde;
    if (req.query.hasta) filtro.hasta = req.query.hasta;
    res.status(200).json({ accesos: await service.listar(filtro) });
  } catch (err) {
    next(err);
  }
}

// Bitácora del usuario autenticado (su propio historial de accesos).
async function mios(req, res, next) {
  try {
    res.status(200).json({ accesos: await service.listar({ id_usuario: req.usuario.id }) });
  } catch (err) {
    next(err);
  }
}

async function registrar(req, res, next) {
  try {
    res.status(201).json({ acceso: await service.registrar(req.body) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, mios, registrar };
