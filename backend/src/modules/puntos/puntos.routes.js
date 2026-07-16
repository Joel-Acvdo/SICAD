// Rutas del módulo de puntos de acceso. Requieren autenticación.
const { Router } = require('express');
const controller = require('./puntos.controller');
const { autenticar } = require('../../middlewares/auth.middleware');

const router = Router();
router.use(autenticar);

// GET /api/puntos → lista de puntos de acceso del campus
router.get('/', controller.listar);

module.exports = router;
