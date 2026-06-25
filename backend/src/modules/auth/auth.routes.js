// Rutas del módulo de autenticación.
const { Router } = require('express');
const controller = require('./auth.controller');
const { validar } = require('../../middlewares/validate.middleware');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const { loginSchema, registroSchema } = require('./auth.schema');

const router = Router();

// POST /api/auth/login  → inicia sesión y devuelve un token JWT
router.post('/login', validar(loginSchema), controller.login);

// POST /api/auth/registro  → alta de usuario (solo Administrador)
router.post(
  '/registro',
  autenticar,
  autorizar('Administrador'),
  validar(registroSchema),
  controller.registrar
);

// GET /api/auth/perfil  → datos del usuario autenticado
router.get('/perfil', autenticar, controller.perfil);

module.exports = router;
