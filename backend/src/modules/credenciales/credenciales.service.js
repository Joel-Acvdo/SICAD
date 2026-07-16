// Lógica de negocio de credenciales: listado, credencial propia y renovación de vigencia.
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

async function listar() {
  return prisma.credencial.findMany({ orderBy: { id_credencial: 'asc' } });
}

// Credencial del usuario autenticado (para la pantalla "Mi credencial").
async function miCredencial(id_usuario) {
  const cred = await prisma.credencial.findFirst({ where: { id_usuario } });
  if (!cred) throw ApiError.notFound('No tienes una credencial asignada');
  return cred;
}

// Renueva la vigencia sumando "meses" a la fecha de vencimiento vigente (o a hoy si ya venció).
async function renovarVigencia(id_usuario, meses) {
  const cred = await prisma.credencial.findFirst({ where: { id_usuario } });
  if (!cred) throw ApiError.notFound('El usuario no tiene credencial');

  const base = cred.fecha_vencimiento > new Date() ? cred.fecha_vencimiento : new Date();
  const vence = new Date(base);
  vence.setMonth(vence.getMonth() + meses);
  const estado = cred.estado === 'VENCIDA' ? 'ACTIVA' : cred.estado;

  return prisma.credencial.update({
    where: { id_credencial: cred.id_credencial },
    data: { fecha_vencimiento: vence, estado },
  });
}

module.exports = { listar, miCredencial, renovarVigencia };
