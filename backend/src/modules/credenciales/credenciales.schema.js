// Esquemas de validación (Zod) del módulo de credenciales.
const { z } = require('zod');

// Renovar/editar vigencia: por "meses" a sumar, o fijando una "fecha_vencimiento" exacta.
const renovarSchema = z
  .object({
    meses: z.number().int().positive('El periodo en meses debe ser positivo').optional(),
    fecha_vencimiento: z.string().optional(),
  })
  .refine((d) => d.meses || d.fecha_vencimiento, {
    message: 'Indica los meses a renovar o una fecha de vencimiento',
  });

module.exports = { renovarSchema };
