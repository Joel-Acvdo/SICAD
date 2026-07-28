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

// Campos comunes: se recorta el espacio sobrante (.trim()) y se limita cada uno
// al tamaño real de su columna en BD, para que un texto largo devuelva un 400
// explicativo en vez de reventar con un 500 (mismo criterio que MEJ-04).
// El correo se guarda SIEMPRE en minúsculas para que no haya duplicados
// del tipo "Joel@upa.edu.mx" vs "joel@upa.edu.mx".
// Un nombre real: letras (con acentos y ñ), espacios, guiones y apóstrofos.
// Rechaza cosas como "7854" o "-=-=-" que ensucian la credencial y la bitácora.
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'’.-]+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
// `plural` ajusta la concordancia ("El nombre debe…" / "Los apellidos deben…").
const textoPersona = (etiqueta, maximo, plural = false) =>
  z
    .string()
    .trim()
    .min(1, `${etiqueta} ${plural ? 'son obligatorios' : 'es obligatorio'}`)
    .min(2, `${etiqueta} ${plural ? 'deben' : 'debe'} tener al menos 2 caracteres`)
    .max(maximo, `${etiqueta} no ${plural ? 'pueden' : 'puede'} exceder ${maximo} caracteres`)
    .regex(SOLO_LETRAS, `${etiqueta}: solo se permiten letras (sin números ni símbolos)`);

const nombreCampo = textoPersona('El nombre', 100);
const apellidosCampo = textoPersona('Los apellidos', 100, true);
const correoCampo = z.string().trim().toLowerCase().email('Correo inválido').max(150, 'El correo no puede exceder 150 caracteres');
// Matrícula / número de empleado: letras y números (se permite guion), sin símbolos raros.
const matriculaCampo = z
  .string()
  .trim()
  .min(1, 'La matrícula o número de empleado es obligatorio')
  .max(50, 'La matrícula no puede exceder 50 caracteres')
  .regex(/^[A-Za-z0-9-]+$/, 'La matrícula solo puede tener letras, números y guiones');
// Carrera o área: letras, números y puntuación normal (puntos, comas, paréntesis…).
const carreraCampo = z
  .string()
  .trim()
  .min(1, 'La carrera o área es obligatoria')
  .max(150, 'La carrera no puede exceder 150 caracteres')
  .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,()/-]+$/, 'La carrera contiene caracteres no válidos');
// La foto debe ser una imagen en data URL (no cualquier texto).
const fotoCampo = z
  .string()
  .max(400000, 'La imagen es demasiado grande')
  .refine((v) => v === '' || /^data:image\/(jpeg|png|webp);base64,/.test(v), 'Formato de imagen no válido');

const crearSchema = z
  .object({
    nombre: nombreCampo,
    apellidos: apellidosCampo,
    correo: correoCampo,
    // Todos los campos son obligatorios al dar de alta; la única excepción es la foto.
    matricula_empleado: matriculaCampo,
    carrera: carreraCampo,
    tipo: z.enum(TIPOS),
    password: z.string().min(1, 'La contraseña es obligatoria'),
    // Foto opcional (data URL base64, ya comprimida por el frontend).
    foto: fotoCampo.optional(),
  })
  .superRefine(validarPassword);

const actualizarSchema = z
  .object({
    nombre: nombreCampo,
    apellidos: apellidosCampo,
    correo: correoCampo,
    // Al editar también son obligatorios (salvo la foto). La contraseña es la
    // excepción razonable: vacía = se conserva la actual, no se obliga a cambiarla.
    matricula_empleado: matriculaCampo,
    carrera: carreraCampo,
    tipo: z.enum(TIPOS).optional(),
    password: z.string().optional(),
    // Si se envía, cambia la foto; si se omite, se conserva la actual.
    foto: fotoCampo.optional(),
  })
  .superRefine(validarPassword);

const estatusSchema = z.object({
  estatus: z.enum(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']),
});

module.exports = { crearSchema, actualizarSchema, estatusSchema };
