// Rutas del módulo de credenciales. Todas requieren autenticación.
const { Router } = require('express');
const controller = require('./credenciales.controller');
const { validar } = require('../../middlewares/validate.middleware');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const { renovarSchema } = require('./credenciales.schema');

const router = Router();
router.use(autenticar);

// GET   /api/credenciales               → todas las credenciales (Servicios Escolares y Caseta)
router.get('/', autorizar('Administrador', 'Seguridad'), controller.listar);

// GET   /api/credenciales/mia            → credencial del usuario autenticado
router.get('/mia', controller.mia);

// PATCH /api/credenciales/usuario/:id/vigencia → renueva la vigencia (Administrador)
router.patch('/usuario/:id/vigencia', autorizar('Administrador'), validar(renovarSchema), controller.renovar);

// POST  /api/credenciales/usuario/:id/reemitir → reemite la credencial: nuevo QR,
// vuelve a ACTIVA con vigencia nueva y el código anterior queda inservible (Administrador)
router.post('/usuario/:id/reemitir', autorizar('Administrador'), controller.reemitir);

module.exports = router;
