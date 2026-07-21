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

// Edita la vigencia: fija una "fecha_vencimiento" exacta, o suma "meses" a la vigencia
// vigente (o a hoy si ya venció). Reactiva la credencial si estaba VENCIDA.
async function renovarVigencia(id_usuario, { meses, fecha_vencimiento }) {
  const cred = await prisma.credencial.findFirst({ where: { id_usuario } });
  if (!cred) throw ApiError.notFound('El usuario no tiene credencial');

  let vence;
  if (fecha_vencimiento) {
    vence = new Date(fecha_vencimiento);
  } else {
    const base = cred.fecha_vencimiento > new Date() ? cred.fecha_vencimiento : new Date();
    vence = new Date(base);
    vence.setMonth(vence.getMonth() + meses);
  }
  const estado = cred.estado === 'VENCIDA' ? 'ACTIVA' : cred.estado;

  return prisma.credencial.update({
    where: { id_credencial: cred.id_credencial },
    data: { fecha_vencimiento: vence, estado },
  });
}

// El usuario reporta SU credencial como perdida → se revoca de inmediato.
async function reportarPerdida(id_usuario) {
  const cred = await prisma.credencial.findFirst({ where: { id_usuario } });
  if (!cred) throw ApiError.notFound('No tienes una credencial asignada');
  return prisma.credencial.update({
    where: { id_credencial: cred.id_credencial },
    data: { estado: 'REVOCADA' },
  });
}

module.exports = { listar, miCredencial, renovarVigencia, reportarPerdida };
