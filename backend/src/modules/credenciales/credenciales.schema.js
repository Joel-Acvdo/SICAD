// Esquemas de validación (Zod) del módulo de credenciales.
const { z } = require('zod');

const renovarSchema = z.object({
  meses: z.number().int().positive('El periodo en meses debe ser positivo'),
});

module.exports = { renovarSchema };
