// Esquemas de validación (Zod) del módulo de visitantes.
const { z } = require('zod');

const registrarSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  identificacion: z.string().min(1, 'La identificación es requerida'),
  empresa: z.string().optional(),
  motivo: z.string().optional(),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
});

module.exports = { registrarSchema };
