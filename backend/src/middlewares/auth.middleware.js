// Middlewares de autenticación y autorización (RBAC).
const { verificarToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

// Verifica el token JWT del header Authorization: Bearer <token>
function autenticar(req, _res, next) {
  const header = req.headers.authorization || '';
  const [esquema, token] = header.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Token no proporcionado'));
  }

  try {
    req.usuario = verificarToken(token); // { id, correo, rol }
    next();
  } catch {
    next(ApiError.unauthorized('Token inválido o expirado'));
  }
}

// Restringe el acceso a ciertos roles. Uso: autorizar('Administrador', 'Seguridad')
function autorizar(...rolesPermitidos) {
  return (req, _res, next) => {
    if (!req.usuario) {
      return next(ApiError.unauthorized());
    }
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(req.usuario.rol)) {
      return next(ApiError.forbidden('No tienes permisos para esta acción'));
    }
    next();
  };
}

module.exports = { autenticar, autorizar };
