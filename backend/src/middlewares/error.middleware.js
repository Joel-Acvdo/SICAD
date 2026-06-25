// Manejo centralizado de errores. Debe registrarse al final de la cadena.
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Errores conocidos de Prisma (ej. violación de restricción única)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  console.error('💥 Error no controlado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// Para rutas no encontradas
function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

module.exports = { errorHandler, notFoundHandler };
