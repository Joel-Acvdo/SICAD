// Lógica de negocio de accesos (bitácora): listado y registro de eventos.
// El modelo real es normalizado (acceso → credencial → usuario, acceso → punto);
// aquí se "aplana" a la forma que consume el frontend.
const prisma = require('../../config/prisma');

const INCLUDE = { punto: true, visitante: true, credencial: { include: { usuario: true } } };

function aplanar(a) {
  const u = a.credencial?.usuario;
  const v = a.visitante; // acceso de un externo (no tiene credencial/usuario)
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
    visitante: v ? { id_visitante: v.id_visitante, nombre: v.nombre, empresa: v.empresa, identificacion: v.identificacion } : null,
    // Nombre unificado para la bitácora (comunidad o externo).
    persona_nombre: u ? `${u.nombre} ${u.apellidos}` : v ? v.nombre : null,
  };
}

async function listar(filtro = {}) {
  const where = {};
  if (filtro.id_usuario) where.credencial = { id_usuario: filtro.id_usuario };
  // Rango de fechas opcional (para reportes por periodo). Formato 'YYYY-MM-DD' = día completo.
  if (filtro.desde || filtro.hasta) {
    where.fecha_hora = {};
    if (filtro.desde) where.fecha_hora.gte = new Date(`${filtro.desde}T00:00:00.000Z`);
    if (filtro.hasta) where.fecha_hora.lte = new Date(`${filtro.hasta}T23:59:59.999Z`);
  }
  const accesos = await prisma.acceso.findMany({ where, include: INCLUDE, orderBy: { fecha_hora: 'desc' } });
  return accesos.map(aplanar);
}

// Resuelve el punto de acceso por nombre (lo crea si no existe).
async function resolverPunto(nombre) {
  let punto = await prisma.puntoAcceso.findFirst({ where: { nombre } });
  if (!punto) punto = await prisma.puntoAcceso.create({ data: { nombre } });
  return punto;
}

async function registrar({ id_usuario, punto_nombre, tipo_evento, resultado }) {
  // Resuelve la credencial del usuario (si aplica) y el punto de acceso (lo crea si no existe).
  const credencial = id_usuario ? await prisma.credencial.findFirst({ where: { id_usuario } }) : null;
  const punto = await resolverPunto(punto_nombre);

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

// Valida una credencial a partir del código QR escaneado y registra el acceso.
// Regla de control de acceso: se PERMITE el paso solo si la credencial existe,
// está ACTIVA y vigente, y su usuario sigue ACTIVO. Cualquier otro caso se DENIEGA,
// pero el intento SIEMPRE queda en la bitácora (con motivo del rechazo).
async function validarQr({ codigo_qr, punto_nombre, tipo_evento }) {
  const credencial = await prisma.credencial.findUnique({
    where: { codigo_qr },
    include: { usuario: true },
  });

  const ahora = new Date();
  let resultado = 'PERMITIDO';
  let motivo = null;

  if (!credencial) {
    resultado = 'DENEGADO';
    motivo = 'Credencial no reconocida';
  } else if (credencial.estado === 'REVOCADA') {
    resultado = 'DENEGADO';
    motivo = 'Credencial revocada';
  } else if (credencial.estado === 'INACTIVA') {
    resultado = 'DENEGADO';
    motivo = 'Credencial inactiva';
  } else if (credencial.estado === 'VENCIDA' || credencial.fecha_vencimiento < ahora) {
    resultado = 'DENEGADO';
    motivo = 'Credencial vencida';
  } else if (credencial.usuario?.estatus !== 'ACTIVO') {
    resultado = 'DENEGADO';
    motivo = 'Usuario dado de baja o suspendido';
  }

  // Si venció por fecha pero seguía marcada ACTIVA, refleja el estado real en BD.
  if (credencial && motivo === 'Credencial vencida' && credencial.estado !== 'VENCIDA') {
    await prisma.credencial.update({
      where: { id_credencial: credencial.id_credencial },
      data: { estado: 'VENCIDA' },
    });
  }

  const punto = await resolverPunto(punto_nombre);
  const acceso = await prisma.acceso.create({
    data: {
      tipo_evento,
      resultado,
      id_credencial: credencial?.id_credencial || null,
      id_punto: punto.id_punto,
    },
    include: INCLUDE,
  });

  return { resultado, motivo, acceso: aplanar(acceso) };
}

module.exports = { listar, registrar, validarQr };
