// Error de aplicación con código HTTP, para un manejo de errores uniforme.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }

  static badRequest(msg = 'Solicitud inválida') {
    return new ApiError(400, msg);
  }
  static unauthorized(msg = 'No autorizado') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Acceso denegado') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Recurso no encontrado') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflicto con el estado actual') {
    return new ApiError(409, msg);
  }
}

module.exports = ApiError;
