// Utilidades de fecha para los filtros por rango (?desde=&hasta=).
const ApiError = require('./ApiError');

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

// Valida un parámetro de fecha 'YYYY-MM-DD'. Devuelve el mismo valor si es
// correcto, undefined si no vino, y lanza un 400 claro si es basura (antes
// una fecha inválida llegaba a Prisma y provocaba un error 500).
function validarFechaParam(valor, nombre) {
  if (valor === undefined || valor === null || valor === '') return undefined;
  if (!FORMATO.test(valor) || Number.isNaN(new Date(`${valor}T12:00:00`).getTime())) {
    throw ApiError.badRequest(`El parámetro "${nombre}" debe tener el formato AAAA-MM-DD`);
  }
  return valor;
}

// Valida el par desde/hasta y comprueba que el rango no esté invertido.
function validarRango(desde, hasta) {
  const d = validarFechaParam(desde, 'desde');
  const h = validarFechaParam(hasta, 'hasta');
  if (d && h && d > h) throw ApiError.badRequest('La fecha "desde" no puede ser posterior a "hasta"');
  return { desde: d, hasta: h };
}

module.exports = { validarFechaParam, validarRango };
