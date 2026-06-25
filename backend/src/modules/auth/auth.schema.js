// Esquemas de validación (Zod) para el módulo de autenticación.
const { z } = require('zod');

const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
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

module.exports = { loginSchema, registroSchema };
