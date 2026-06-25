// Controladores HTTP del módulo de autenticación.
const authService = require('./auth.service');

async function registrar(req, res, next) {
  try {
    const usuario = await authService.registrar(req.body);
    res.status(201).json({ usuario });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { correo, password } = req.body;
    const data = await authService.login(correo, password);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

async function perfil(req, res, next) {
  try {
    const usuario = await authService.obtenerPerfil(req.usuario.id);
    res.status(200).json({ usuario });
  } catch (err) {
    next(err);
  }
}

module.exports = { registrar, login, perfil };
