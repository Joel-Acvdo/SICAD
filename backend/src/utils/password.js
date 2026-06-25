// Hash y comparación de contraseñas con bcrypt.
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function hashPassword(plano) {
  return bcrypt.hash(plano, SALT_ROUNDS);
}

function compararPassword(plano, hash) {
  return bcrypt.compare(plano, hash);
}

module.exports = { hashPassword, compararPassword };
