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

// Genera un código QR nuevo y único para una credencial reemitida.
function nuevoCodigoQR(matricula) {
  const sufijo = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `QR-${matricula || 'USER'}-${sufijo}`;
}

// Reemite la credencial de un usuario (MEJ-05): Servicios Escolares le devuelve el
// acceso a quien reportó su credencial como perdida. Se le asigna un CÓDIGO QR NUEVO
// (el anterior deja de existir en BD → queda inservible para siempre), la credencial
// vuelve a ACTIVA y se emite con vigencia nueva de un año. Se reemplaza sobre la misma
// fila para no dejar credenciales huérfanas que la reactivación en cascada revive.
async function reemitir(id_usuario) {
  const cred = await prisma.credencial.findFirst({
    where: { id_usuario },
    orderBy: { id_credencial: 'desc' },
  });
  if (!cred) throw ApiError.notFound('El usuario no tiene credencial');

  const usuario = await prisma.usuario.findUnique({ where: { id_usuario } });
  const vence = new Date();
  vence.setFullYear(vence.getFullYear() + 1);

  return prisma.credencial.update({
    where: { id_credencial: cred.id_credencial },
    data: {
      codigo_qr: nuevoCodigoQR(usuario?.matricula_empleado),
      estado: 'ACTIVA',
      fecha_emision: new Date(),
      fecha_vencimiento: vence,
    },
  });
}

module.exports = { listar, miCredencial, renovarVigencia, reportarPerdida, reemitir };
