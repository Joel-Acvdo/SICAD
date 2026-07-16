// Rutas del módulo de usuarios. Todas requieren autenticación.
const { Router } = require('express');
const controller = require('./usuarios.controller');
const { validar } = require('../../middlewares/validate.middleware');
const { autenticar, autorizar } = require('../../middlewares/auth.middleware');
const { crearSchema, actualizarSchema, estatusSchema } = require('./usuarios.schema');

const router = Router();
router.use(autenticar);

// GET    /api/usuarios            → lista de usuarios (Servicios Escolares y Caseta)
router.get('/', autorizar('Administrador', 'Seguridad'), controller.listar);

// POST   /api/usuarios            → alta de usuario + emisión de credencial (Administrador)
router.post('/', autorizar('Administrador'), validar(crearSchema), controller.crear);

// GET    /api/usuarios/:id        → detalle de un usuario
router.get('/:id', controller.obtener);

// PUT    /api/usuarios/:id        → edición de un usuario (Administrador)
router.put('/:id', autorizar('Administrador'), validar(actualizarSchema), controller.actualizar);

// PATCH  /api/usuarios/:id/estatus → activar / revocar (Administrador)
router.patch('/:id/estatus', autorizar('Administrador'), validar(estatusSchema), controller.cambiarEstatus);

module.exports = router;
