// Controladores HTTP del módulo de accesos (bitácora).
const service = require('./accesos.service');
const { validarRango } = require('../../utils/fechas');
const ApiError = require('../../utils/ApiError');

async function listar(req, res, next) {
  try {
    const filtro = {};
    // id_usuario debe ser un número real (evita NaN llegando a Prisma).
    if (req.query.id_usuario) {
      const id = Number(req.query.id_usuario);
      if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest('El parámetro "id_usuario" no es válido');
      filtro.id_usuario = id;
    }
    // Rango de fechas validado (formato AAAA-MM-DD y desde <= hasta).
    const { desde, hasta } = validarRango(req.query.desde, req.query.hasta);
    if (desde) filtro.desde = desde;
    if (hasta) filtro.hasta = hasta;
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

// Valida por código QR escaneado y registra el evento. Responde con el resultado
// (PERMITIDO/DENEGADO), el motivo del rechazo si aplica y el acceso registrado.
async function validarQr(req, res, next) {
  try {
    res.status(201).json(await service.validarQr(req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, mios, registrar, validarQr };
