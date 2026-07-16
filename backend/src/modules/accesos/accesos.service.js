// Lógica de negocio de accesos (bitácora): listado y registro de eventos.
// El modelo real es normalizado (acceso → credencial → usuario, acceso → punto);
// aquí se "aplana" a la forma que consume el frontend.
const prisma = require('../../config/prisma');

const INCLUDE = { punto: true, credencial: { include: { usuario: true } } };

function aplanar(a) {
  const u = a.credencial?.usuario;
  return {
    id_acceso: a.id_acceso,
    fecha_hora: a.fecha_hora,
    tipo_evento: a.tipo_evento,
    resultado: a.resultado,
    punto_nombre: a.punto?.nombre || null,
    id_usuario: u?.id_usuario || null,
    usuario: u
      ? { id_usuario: u.id_usuario, nombre: u.nombre, apellidos: u.apellidos, matricula_empleado: u.matricula_empleado }
      : null,
  };
}

async function listar(filtro = {}) {
  const where = {};
  if (filtro.id_usuario) where.credencial = { id_usuario: filtro.id_usuario };
  const accesos = await prisma.acceso.findMany({ where, include: INCLUDE, orderBy: { fecha_hora: 'desc' } });
  return accesos.map(aplanar);
}

async function registrar({ id_usuario, punto_nombre, tipo_evento, resultado }) {
  // Resuelve la credencial del usuario (si aplica) y el punto de acceso (lo crea si no existe).
  const credencial = id_usuario ? await prisma.credencial.findFirst({ where: { id_usuario } }) : null;
  let punto = await prisma.puntoAcceso.findFirst({ where: { nombre: punto_nombre } });
  if (!punto) punto = await prisma.puntoAcceso.create({ data: { nombre: punto_nombre } });

  const acceso = await prisma.acceso.create({
    data: {
      tipo_evento,
      resultado,
      id_credencial: credencial?.id_credencial || null,
      id_punto: punto.id_punto,
    },
    include: INCLUDE,
  });
  return aplanar(acceso);
}

module.exports = { listar, registrar };
