// Controladores HTTP del módulo de visitantes.
const service = require('./visitantes.service');

async function listar(_req, res, next) {
  try {
    res.status(200).json({ visitantes: await service.listar() });
  } catch (err) {
    next(err);
  }
}

async function registrar(req, res, next) {
  try {
    // El usuario que registra (personal de caseta) sale del token.
    res.status(201).json({ visitante: await service.registrar(req.body, req.usuario.id) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, registrar };
