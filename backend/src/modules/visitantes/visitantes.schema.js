// Esquemas de validación (Zod) del módulo de visitantes.
const { z } = require('zod');

const registrarSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  identificacion: z.string().min(1, 'La identificación es requerida'),
  empresa: z.string().optional(),
  motivo: z.string().optional(),
  destino: z.string().optional(),
  // El registro genera un acceso de entrada; las fechas ya no son obligatorias.
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

module.exports = { registrarSchema };
