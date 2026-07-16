// Esquemas de validación (Zod) del módulo de usuarios.
const { z } = require('zod');

const TIPOS = ['ALUMNO', 'TRABAJADOR', 'ADMINISTRATIVO', 'DOCENTE', 'SEGURIDAD'];

const crearSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  correo: z.string().email('Correo inválido'),
  matricula_empleado: z.string().optional(),
  carrera: z.string().optional(),
  tipo: z.enum(TIPOS),
});

const actualizarSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  correo: z.string().email('Correo inválido'),
  matricula_empleado: z.string().nullable().optional(),
  carrera: z.string().nullable().optional(),
  tipo: z.enum(TIPOS).optional(),
});

const estatusSchema = z.object({
  estatus: z.enum(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']),
});

module.exports = { crearSchema, actualizarSchema, estatusSchema };
