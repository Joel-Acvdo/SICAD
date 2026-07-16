// Rutas del módulo de visitantes. Requieren autenticación (Caseta y Servicios Escolares).
const { Router } = require('express');
const controller = require('./visitantes.controller');
const { validar } = require('../../middlewares/validate.middleware');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const { registrarSchema } = require('./visitantes.schema');

const router = Router();
router.use(autenticar, autorizar('Administrador', 'Seguridad'));

// GET  /api/visitantes → lista de externos registrados
router.get('/', controller.listar);

// POST /api/visitantes → registra un externo con pase temporal
router.post('/', validar(registrarSchema), controller.registrar);

module.exports = router;
