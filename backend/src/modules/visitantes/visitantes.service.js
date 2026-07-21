// Lógica de negocio de visitantes (externos). Al registrar un externo se deja
// constancia de su ENTRADA en la bitácora (un Acceso ligado al visitante),
// en lugar de emitir un "pase temporal".
const prisma = require('../../config/prisma');

const PUNTO_EXTERNO = 'Entrada Principal (externo)';

async function listar() {
  return prisma.visitante.findMany({ orderBy: { id_visitante: 'desc' } });
}

async function registrar(datos, id_usuario_registro) {
  const ahora = new Date();
  // El externo no maneja vigencia de pase: el registro es un acceso de entrada.
  const fin = datos.fecha_fin ? new Date(datos.fecha_fin) : ahora;

  // Punto por el que ingresa el externo (se crea si aún no existe).
  let punto = await prisma.puntoAcceso.findFirst({ where: { nombre: PUNTO_EXTERNO } });
  if (!punto) punto = await prisma.puntoAcceso.create({ data: { nombre: PUNTO_EXTERNO } });

  // Alta del externo + su acceso de ENTRADA (queda en la bitácora) en un solo paso.
  return prisma.visitante.create({
    data: {
      nombre: datos.nombre,
      identificacion: datos.identificacion,
      empresa: datos.empresa || null,
      motivo: datos.motivo || null,
      fecha_inicio: ahora,
      fecha_fin: fin,
      id_usuario_registro,
      accesos: {
        create: { tipo_evento: 'ENTRADA', resultado: 'PERMITIDO', id_punto: punto.id_punto },
      },
    },
  });
}

module.exports = { listar, registrar };
