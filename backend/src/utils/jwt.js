// Generación y verificación de tokens JWT.
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

function generarToken(payload) {
  return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
}

function verificarToken(token) {
  return jwt.verify(token, jwtConfig.secret);
}

module.exports = { generarToken, verificarToken };
