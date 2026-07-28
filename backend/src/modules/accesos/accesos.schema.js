// Esquemas de validación (Zod) del módulo de accesos.
const { z } = require('zod');

const registrarSchema = z.object({
  id_usuario: z.number().int().positive().optional(),
  // Se limita al tamaño de la columna en BD (VarChar 100) para no reventar con 500.
  punto_nombre: z.string().trim().min(1, 'El punto de acceso es requerido').max(100, 'El punto no puede exceder 100 caracteres'),
  tipo_evento: z.enum(['ENTRADA', 'SALIDA']),
  resultado: z.enum(['PERMITIDO', 'DENEGADO']),
});

// Validación por código QR escaneado: solo se recibe el código leído, el punto
// y el tipo de evento. El backend decide si el acceso se permite o se deniega.
const validarQrSchema = z.object({
  codigo_qr: z.string().trim().min(1, 'El código QR es requerido').max(255, 'El código QR no es válido'),
  punto_nombre: z.string().trim().min(1, 'El punto de acceso es requerido').max(100, 'El punto no puede exceder 100 caracteres'),
  tipo_evento: z.enum(['ENTRADA', 'SALIDA']),
});

module.exports = { registrarSchema, validarQrSchema };
