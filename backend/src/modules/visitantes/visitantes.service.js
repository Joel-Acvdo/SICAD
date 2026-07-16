// Lógica de negocio de visitantes (externos con pase temporal).
const prisma = require('../../config/prisma');

async function listar() {
  return prisma.visitante.findMany({ orderBy: { id_visitante: 'desc' } });
}

async function registrar(datos, id_usuario_registro) {
  return prisma.visitante.create({
    data: {
      nombre: datos.nombre,
      identificacion: datos.identificacion,
      empresa: datos.empresa || null,
      motivo: datos.motivo || null,
      fecha_inicio: new Date(datos.fecha_inicio),
      fecha_fin: new Date(datos.fecha_fin),
      id_usuario_registro,
    },
  });
}

module.exports = { listar, registrar };
