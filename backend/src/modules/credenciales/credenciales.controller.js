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
    const credencial = await service.renovarVigencia(Number(req.params.id), req.body);
    res.status(200).json({ credencial });
  } catch (err) {
    next(err);
  }
}

async function reportarPerdida(req, res, next) {
  try {
    res.status(200).json({ credencial: await service.reportarPerdida(req.usuario.id) });
  } catch (err) {
    next(err);
  }
}

// Reemite la credencial de un usuario (Servicios Escolares): nuevo QR + vigencia nueva.
async function reemitir(req, res, next) {
  try {
    res.status(200).json({ credencial: await service.reemitir(Number(req.params.id)) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, mia, renovar, reportarPerdida, reemitir };
