// Controladores HTTP del módulo de usuarios.
const service = require('./usuarios.service');

async function listar(_req, res, next) {
  try {
    res.status(200).json({ usuarios: await service.listar() });
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    res.status(200).json({ usuario: await service.obtener(Number(req.params.id)) });
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    res.status(201).json({ usuario: await service.crear(req.body) });
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    res.status(200).json({ usuario: await service.actualizar(Number(req.params.id), req.body) });
  } catch (err) {
    next(err);
  }
}

async function cambiarEstatus(req, res, next) {
  try {
    res.status(200).json({ usuario: await service.cambiarEstatus(Number(req.params.id), req.body.estatus) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstatus };
