// Esquemas de validación (Zod) del módulo de accesos.
const { z } = require('zod');

const registrarSchema = z.object({
  id_usuario: z.number().int().positive().optional(),
  punto_nombre: z.string().min(1, 'El punto de acceso es requerido'),
  tipo_evento: z.enum(['ENTRADA', 'SALIDA']),
  resultado: z.enum(['PERMITIDO', 'DENEGADO']),
});

module.exports = { registrarSchema };
