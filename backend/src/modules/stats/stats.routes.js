// Rutas del dashboard de estadísticas (solo Administrador).
const { Router } = require('express');
const controller = require('./stats.controller');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');

const router = Router();
router.use(autenticar);

// GET /api/stats → métricas agregadas para el dashboard de Servicios Escolares
router.get('/', autorizar('Administrador'), controller.stats);

module.exports = router;
