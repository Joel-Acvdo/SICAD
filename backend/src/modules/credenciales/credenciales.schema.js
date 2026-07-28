// Esquemas de validación (Zod) del módulo de credenciales.
const { z } = require('zod');

// Vigencia máxima de una credencial: 2 años (24 meses) a partir de hoy.
const MESES_MAX = 24;
const limiteMaximo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Renovar/editar vigencia: por "meses" a sumar, o fijando una "fecha_vencimiento" exacta.
// La fecha debe ser real (YYYY-MM-DD), no estar en el pasado y no pasar de 2 años.
const renovarSchema = z
  .object({
    meses: z
      .number()
      .int()
      .positive('El periodo en meses debe ser positivo')
      .max(MESES_MAX, `La vigencia no puede exceder ${MESES_MAX} meses (2 años)`)
      .optional(),
    fecha_vencimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
      .refine((f) => !Number.isNaN(new Date(`${f}T12:00:00`).getTime()), 'La fecha no es válida')
      .refine((f) => new Date(`${f}T23:59:59`) >= new Date(), 'La fecha de vencimiento no puede estar en el pasado')
      .refine((f) => new Date(`${f}T12:00:00`) <= limiteMaximo(), 'La vigencia no puede ser mayor a 2 años')
      .optional(),
  })
  .refine((d) => d.meses || d.fecha_vencimiento, {
    message: 'Indica los meses a renovar o una fecha de vencimiento',
  });

module.exports = { renovarSchema };
