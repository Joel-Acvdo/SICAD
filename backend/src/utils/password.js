// Hash y comparación de contraseñas con bcrypt.
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function hashPassword(plano) {
  return bcrypt.hash(plano, SALT_ROUNDS);
}

function compararPassword(plano, hash) {
  return bcrypt.compare(plano, hash);
}

// Lista corta de contraseñas obvias que no se aceptan (incluye la temporal por defecto).
const PASSWORDS_COMUNES = [
  '123456', '1234567', '12345678', '123456789', 'password', 'contraseña',
  'qwerty', 'abc123', 'sicad123!', 'alumno123!', 'admin123!', 'caseta123!',
];

// Evalúa la fortaleza de una contraseña. Devuelve { ok, motivo }.
// Regla: mínimo 8 caracteres, combinar letras y números, no estar en la lista de
// contraseñas obvias y no ser la propia matrícula del usuario.
function evaluarPassword(plano, matricula) {
  if (!plano || plano.length < 8) {
    return { ok: false, motivo: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[a-zA-Z]/.test(plano) || !/[0-9]/.test(plano)) {
    return { ok: false, motivo: 'La contraseña debe combinar letras y números' };
  }
  const p = plano.toLowerCase();
  if (PASSWORDS_COMUNES.includes(p)) {
    return { ok: false, motivo: 'La contraseña es demasiado común, elige otra' };
  }
  if (matricula && p === matricula.toLowerCase()) {
    return { ok: false, motivo: 'La contraseña no puede ser tu matrícula' };
  }
  return { ok: true, motivo: null };
}

module.exports = { hashPassword, compararPassword, evaluarPassword };
