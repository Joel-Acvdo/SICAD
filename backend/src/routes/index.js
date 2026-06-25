// Enrutador principal de la API. Aquí se montan todos los módulos.
const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'SICAD API', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);

// Próximos módulos (esquema ER ya listo en la base de datos):
// router.use('/usuarios', usuariosRoutes);
// router.use('/credenciales', credencialesRoutes);
// router.use('/accesos', accesosRoutes);
// router.use('/visitantes', visitantesRoutes);
// router.use('/puntos', puntosRoutes);

module.exports = router;
