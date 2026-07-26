// Rutas del módulo de accesos (bitácora). Todas requieren autenticación.
const { Router } = require('express');
const controller = require('./accesos.controller');
const { validar } = require('../../middlewares/validate.middleware');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const { registrarSchema, validarQrSchema } = require('./accesos.schema');

const router = Router();
router.use(autenticar);

// GET  /api/accesos/mios  → historial del usuario autenticado
router.get('/mios', controller.mios);

// GET  /api/accesos       → bitácora completa (Servicios Escolares y Caseta). Filtro ?id_usuario=
router.get('/', autorizar('Administrador', 'Seguridad'), controller.listar);

// POST /api/accesos       → registra un evento de acceso (Servicios Escolares y Caseta)
router.post('/', autorizar('Administrador', 'Seguridad'), validar(registrarSchema), controller.registrar);

// POST /api/accesos/validar-qr → valida una credencial por su código QR escaneado
// y registra el acceso (terminal de caseta con lector de cámara).
router.post('/validar-qr', autorizar('Administrador', 'Seguridad'), validar(validarQrSchema), controller.validarQr);

module.exports = router;
