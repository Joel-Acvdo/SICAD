// Lógica de negocio de credenciales: listado, credencial propia y renovación de vigencia.
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { generarCodigoQr } = require('../../utils/codigoQr');

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

  // Tope duro: ninguna credencial puede quedar vigente más de 2 años desde hoy
  // (aunque se apilen varias renovaciones de +12 meses).
  const maximo = new Date();
  maximo.setFullYear(maximo.getFullYear() + 2);
  if (vence > maximo) {
    throw ApiError.badRequest('La vigencia no puede ser mayor a 2 años a partir de hoy');
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

// El código nuevo también es opaco (no lleva la matrícula) — ver utils/codigoQr.js.

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
      codigo_qr: generarCodigoQr(),
      estado: 'ACTIVA',
      fecha_emision: new Date(),
      fecha_vencimiento: vence,
    },
  });
}

module.exports = { listar, miCredencial, renovarVigencia, reportarPerdida, reemitir };
