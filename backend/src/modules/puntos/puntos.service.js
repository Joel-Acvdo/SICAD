// Lógica de negocio de puntos de acceso.
const prisma = require('../../config/prisma');

async function listar() {
  return prisma.puntoAcceso.findMany({ orderBy: { id_punto: 'asc' } });
}

module.exports = { listar };
