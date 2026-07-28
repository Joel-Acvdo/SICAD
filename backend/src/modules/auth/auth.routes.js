// Rutas del módulo de autenticación.
const { Router } = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const controller = require('./auth.controller');
const { validar } = require('../../middlewares/validate.middleware');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const { loginSchema, registroSchema, cambiarPasswordSchema } = require('./auth.schema');

const router = Router();

// Protección contra fuerza bruta: máximo 5 intentos FALLIDOS de login por
// minuto desde la misma IP. Los inicios de sesión correctos no cuentan, así que
// un usuario normal nunca lo nota; un bot que prueba contraseñas se frena.
// Se cuenta POR CUENTA (correo/matrícula) y no por IP, porque el frontend
// hace de proxy: todas las peticiones llegarían con la misma IP y un solo
// atacante dejaría fuera a los demás. Si no viene identificador, cae a la IP.
const limiteLogin = rateLimit({
  windowMs: 60 * 1000, // ventana de 1 minuto
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const id = String(req.body?.identificador || '').trim().toLowerCase();
    return id || ipKeyGenerator(req.ip);
  },
  message: { error: 'Demasiados intentos fallidos. Espera un minuto e inténtalo de nuevo.' },
});

// POST /api/auth/login  → inicia sesión y devuelve un token JWT
router.post('/login', limiteLogin, validar(loginSchema), controller.login);

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

// PATCH /api/auth/password → el usuario cambia SU contraseña (pide la actual)
router.patch('/password', autenticar, validar(cambiarPasswordSchema), controller.cambiarPassword);

module.exports = router;
