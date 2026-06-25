// Middleware de validación con Zod. Valida req.body contra un esquema.
const ApiError = require('../utils/ApiError');

function validar(schema) {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      const mensaje = resultado.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return next(ApiError.badRequest(mensaje));
    }
    req.body = resultado.data;
    next();
  };
}

module.exports = { validar };
