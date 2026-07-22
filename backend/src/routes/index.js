// Enrutador principal de la API. Aquí se montan todos los módulos.
const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const usuariosRoutes = require('../modules/usuarios/usuarios.routes');
const credencialesRoutes = require('../modules/credenciales/credenciales.routes');
const accesosRoutes = require('../modules/accesos/accesos.routes');
const visitantesRoutes = require('../modules/visitantes/visitantes.routes');
const puntosRoutes = require('../modules/puntos/puntos.routes');
const statsRoutes = require('../modules/stats/stats.routes');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'SICAD API', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/credenciales', credencialesRoutes);
router.use('/accesos', accesosRoutes);
router.use('/visitantes', visitantesRoutes);
router.use('/puntos', puntosRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
