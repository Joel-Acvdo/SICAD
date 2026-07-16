// Controladores HTTP del módulo de credenciales.
const service = require('./credenciales.service');

async function listar(_req, res, next) {
  try {
    res.status(200).json({ credenciales: await service.listar() });
  } catch (err) {
    next(err);
  }
}

async function mia(req, res, next) {
  try {
    res.status(200).json({ credencial: await service.miCredencial(req.usuario.id) });
  } catch (err) {
    next(err);
  }
}

async function renovar(req, res, next) {
  try {
    const credencial = await service.renovarVigencia(Number(req.params.id), req.body.meses);
    res.status(200).json({ credencial });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, mia, renovar };
