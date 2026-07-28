// ============================================================================
// Validación del formulario de usuario, del lado del navegador.
// Refleja las MISMAS reglas del backend (usuarios.schema.js) para que el error
// salga al instante bajo el campo, sin esperar la respuesta del servidor.
// El backend sigue validando igual: esto es comodidad, no seguridad.
//
// Todos los campos son obligatorios EXCEPTO la foto. La contraseña solo es
// obligatoria al REGISTRAR (al editar, vacía = se conserva la actual).
// ============================================================================

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'’.-]+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const MATRICULA = /^[A-Za-z0-9-]+$/;
const CARRERA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,()/-]+$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORDS_COMUNES = [
  '123456', '1234567', '12345678', '123456789', 'password', 'contraseña',
  'qwerty', 'abc123', 'sicad123!', 'alumno123!', 'admin123!', 'caseta123!',
];

// Texto de persona (nombre / apellidos). `plural` ajusta la concordancia
// ("El nombre es obligatorio" vs "Los apellidos son obligatorios").
function validarTextoPersona(valor, etiqueta, maximo, plural = false) {
  const v = (valor || '').trim();
  const es = plural ? 'son obligatorios' : 'es obligatorio';
  const debe = plural ? 'deben' : 'debe';
  const puede = plural ? 'pueden' : 'puede';
  if (!v) return `${etiqueta} ${es}`;
  if (v.length < 2) return `${etiqueta} ${debe} tener al menos 2 caracteres`;
  if (v.length > maximo) return `${etiqueta} no ${puede} exceder ${maximo} caracteres`;
  if (!SOLO_LETRAS.test(v)) return `${etiqueta}: solo se permiten letras (sin números ni símbolos)`;
  return null;
}

// Fortaleza de la contraseña (igual que evaluarPassword del backend).
export function validarPassword(valor, matricula) {
  const v = valor || '';
  if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[a-zA-Z]/.test(v) || !/[0-9]/.test(v)) return 'La contraseña debe combinar letras y números';
  if (PASSWORDS_COMUNES.includes(v.toLowerCase())) return 'La contraseña es demasiado común, elige otra';
  if (matricula && v.toLowerCase() === String(matricula).toLowerCase()) return 'La contraseña no puede ser tu matrícula';
  return null;
}

// Valida todo el formulario y devuelve { campo: "mensaje" } (vacío = todo bien).
// modo: 'crear' (contraseña obligatoria) | 'editar' (contraseña opcional)
export function validarFormularioUsuario(f, modo = 'crear') {
  const e = {};

  const errNombre = validarTextoPersona(f.nombre, 'El nombre', 100);
  if (errNombre) e.nombre = errNombre;

  const errApellidos = validarTextoPersona(f.apellidos, 'Los apellidos', 100, true);
  if (errApellidos) e.apellidos = errApellidos;

  const correo = (f.correo || '').trim();
  if (!correo) e.correo = 'El correo es obligatorio';
  else if (!CORREO.test(correo)) e.correo = 'Correo inválido (ejemplo: usuario@upa.edu.mx)';
  else if (correo.length > 150) e.correo = 'El correo no puede exceder 150 caracteres';

  const matricula = (f.matricula_empleado || '').trim();
  if (!matricula) e.matricula_empleado = 'La matrícula o número de empleado es obligatorio';
  else if (matricula.length > 50) e.matricula_empleado = 'La matrícula no puede exceder 50 caracteres';
  else if (!MATRICULA.test(matricula)) e.matricula_empleado = 'La matrícula solo puede tener letras, números y guiones';

  const carrera = (f.carrera || '').trim();
  if (!carrera) e.carrera = 'La carrera o área es obligatoria';
  else if (carrera.length > 150) e.carrera = 'La carrera no puede exceder 150 caracteres';
  else if (!CARRERA.test(carrera)) e.carrera = 'La carrera contiene caracteres no válidos';

  const pass = f.password || '';
  if (modo === 'crear') {
    if (!pass) e.password = 'La contraseña es obligatoria';
    else {
      const errPass = validarPassword(pass, matricula);
      if (errPass) e.password = errPass;
    }
  } else if (pass) {
    // Al editar solo se valida si escribieron una nueva.
    const errPass = validarPassword(pass, matricula);
    if (errPass) e.password = errPass;
  }

  return e;
}
