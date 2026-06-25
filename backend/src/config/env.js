// Carga y valida las variables de entorno una sola vez.
require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  console.warn(`⚠️  Faltan variables de entorno: ${missing.join(', ')}`);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'secreto_de_desarrollo',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};
