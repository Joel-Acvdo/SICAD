// Esquemas de validación (Zod) del módulo de usuarios.
const { z } = require('zod');
const { evaluarPassword } = require('../../utils/password');

const TIPOS = ['ALUMNO', 'TRABAJADOR', 'ADMINISTRATIVO', 'DOCENTE', 'SEGURIDAD'];

// Refinamiento reutilizable: si viene contraseña, se exige que sea fuerte (MEJ-03).
// Va como superRefine a nivel de objeto para poder compararla con la matrícula.
function validarPassword(data, ctx) {
  if (!data.password) return; // vacía = se conserva/asigna temporal, no se valida aquí
  const { ok, motivo } = evaluarPassword(data.password, data.matricula_empleado);
  if (!ok) ctx.addIssue({ path: ['password'], code: z.ZodIssueCode.custom, message: motivo });
}

const crearSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    apellidos: z.string().min(1, 'Los apellidos son requeridos'),
    correo: z.string().email('Correo inválido'),
    matricula_empleado: z.string().optional(),
    carrera: z.string().optional(),
    tipo: z.enum(TIPOS),
    // Contraseña opcional: si no se envía, se asigna una temporal por defecto.
    password: z.string().optional(),
    // Foto opcional (data URL base64, ya comprimida por el frontend).
    foto: z.string().max(400000, 'La imagen es demasiado grande').optional(),
  })
  .superRefine(validarPassword);

const actualizarSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    apellidos: z.string().min(1, 'Los apellidos son requeridos'),
    correo: z.string().email('Correo inválido'),
    matricula_empleado: z.string().nullable().optional(),
    carrera: z.string().nullable().optional(),
    tipo: z.enum(TIPOS).optional(),
    // Si se envía, cambia la contraseña; si se omite, se conserva la actual.
    password: z.string().optional(),
    // Si se envía, cambia la foto; si se omite, se conserva la actual.
    foto: z.string().max(400000, 'La imagen es demasiado grande').optional(),
  })
  .superRefine(validarPassword);

const estatusSchema = z.object({
  estatus: z.enum(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']),
});

module.exports = { crearSchema, actualizarSchema, estatusSchema };
