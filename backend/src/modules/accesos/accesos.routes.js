// Rutas del módulo de accesos (bitácora). Todas requieren autenticación.
const { Router } = require('express');
const controller = require('./accesos.controller');
const { validar } = require('../../middlewares/validate.middleware');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const { registrarSchema } = require('./accesos.schema');

const router = Router();
router.use(autenticar);

// GET  /api/accesos/mios  → historial del usuario autenticado
router.get('/mios', controller.mios);

// GET  /api/accesos       → bitácora completa (Servicios Escolares y Caseta). Filtro ?id_usuario=
router.get('/', autorizar('Administrador', 'Seguridad'), controller.listar);

// POST /api/accesos       → registra un evento de acceso (Servicios Escolares y Caseta)
router.post('/', autorizar('Administrador', 'Seguridad'), validar(registrarSchema), controller.registrar);

module.exports = router;
