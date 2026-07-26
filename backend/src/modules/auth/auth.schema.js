// Esquemas de validación (Zod) para el módulo de autenticación.
const { z } = require('zod');
const { evaluarPassword } = require('../../utils/password');

const loginSchema = z.object({
  identificador: z.string().min(1, 'Ingresa tu correo o matrícula'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const registroSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  correo: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  matricula_empleado: z.string().optional(),
  tipo: z.enum(['ALUMNO', 'TRABAJADOR', 'ADMINISTRATIVO', 'DOCENTE', 'SEGURIDAD']),
  id_rol: z.number().int().positive('id_rol inválido'),
});

// Cambio de contraseña del PROPIO usuario: exige la actual y una nueva fuerte.
const cambiarPasswordSchema = z
  .object({
    actual: z.string().min(1, 'Ingresa tu contraseña actual'),
    nueva: z.string().min(1, 'Ingresa la contraseña nueva'),
  })
  .superRefine((data, ctx) => {
    const { ok, motivo } = evaluarPassword(data.nueva);
    if (!ok) ctx.addIssue({ path: ['nueva'], code: z.ZodIssueCode.custom, message: motivo });
    if (data.actual === data.nueva) {
      ctx.addIssue({ path: ['nueva'], code: z.ZodIssueCode.custom, message: 'La contraseña nueva debe ser diferente a la actual' });
    }
  });

module.exports = { loginSchema, registroSchema, cambiarPasswordSchema };
