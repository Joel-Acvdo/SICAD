// Esquemas de validación (Zod) del módulo de visitantes.
const { z } = require('zod');

// Se recorta el espacio sobrante (.trim()) y se limita cada campo al tamaño real de
// su columna en BD; lo que exceda se rechaza con un 400 explicativo (MEJ-04). Así la
// bitácora queda limpia y se evitan los errores 500 por textos demasiado largos.
const registrarSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(150, 'El nombre no puede exceder 150 caracteres'),
  identificacion: z.string().trim().min(1, 'La identificación es requerida').max(50, 'La identificación no puede exceder 50 caracteres'),
  empresa: z.string().trim().max(150, 'La empresa no puede exceder 150 caracteres').optional(),
  motivo: z.string().trim().max(255, 'El motivo no puede exceder 255 caracteres').optional(),
  destino: z.string().trim().max(255, 'El destino no puede exceder 255 caracteres').optional(),
  // El registro genera un acceso de entrada; las fechas ya no son obligatorias.
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

module.exports = { registrarSchema };
