// Lógica de negocio del dashboard: agrega métricas del sistema (Prisma groupBy/count).
// Las métricas de accesos se calculan sobre un RANGO de fechas (desde/hasta);
// si no se indica, el rango por defecto es los últimos 7 días.
const prisma = require('../../config/prisma');

// Formatea una fecha como YYYY-MM-DD en hora local (para agrupar por día).
function fechaLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const iniDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const finDia = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

async function obtenerStats({ desde, hasta } = {}) {
  const hoy = new Date();
  // desde/hasta llegan como 'YYYY-MM-DD'; se toman como día completo (00:00 → 23:59).
  const hastaD = hasta ? new Date(`${hasta}T23:59:59.999Z`) : finDia(hoy);
  const desdeD = desde ? new Date(`${desde}T00:00:00.000Z`) : iniDia(new Date(hoy.getTime() - 6 * 86400000));
  const rangoWhere = { fecha_hora: { gte: desdeD, lte: hastaD } };

  const [
    usuariosPorTipoEstatus,
    credencialesPorEstado,
    accesosResultadoRango,
    totalUsuarios,
    usuariosActivos,
    credencialesVigentes,
    accesosRango,
  ] = await Promise.all([
    prisma.usuario.groupBy({ by: ['tipo', 'estatus'], _count: { _all: true } }),
    prisma.credencial.groupBy({ by: ['estado'], _count: { _all: true } }),
    prisma.acceso.groupBy({ by: ['resultado'], where: rangoWhere, _count: { _all: true } }),
    prisma.usuario.count(),
    prisma.usuario.count({ where: { estatus: 'ACTIVO' } }),
    prisma.credencial.count({ where: { estado: 'ACTIVA' } }),
    prisma.acceso.findMany({ where: rangoWhere, select: { fecha_hora: true } }),
  ]);

  const permitidos = accesosResultadoRango.find((a) => a.resultado === 'PERMITIDO')?._count._all || 0;
  const denegados = accesosResultadoRango.find((a) => a.resultado === 'DENEGADO')?._count._all || 0;

  // Usuarios por tipo, con desglose activos / inactivos (estado actual, no depende del rango).
  const porTipo = {};
  for (const r of usuariosPorTipoEstatus) {
    if (!porTipo[r.tipo]) porTipo[r.tipo] = { tipo: r.tipo, activos: 0, inactivos: 0, total: 0 };
    const n = r._count._all;
    porTipo[r.tipo].total += n;
    if (r.estatus === 'ACTIVO') porTipo[r.tipo].activos += n;
    else porTipo[r.tipo].inactivos += n;
  }

  // Accesos por día: un bucket por cada día del rango (desde..hasta).
  const dias = [];
  const cur = iniDia(desdeD);
  const finBucket = iniDia(hastaD);
  while (cur <= finBucket) {
    dias.push({ fecha: fechaLocal(cur), total: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  const idx = Object.fromEntries(dias.map((d, i) => [d.fecha, i]));
  for (const a of accesosRango) {
    const key = fechaLocal(new Date(a.fecha_hora));
    if (key in idx) dias[idx[key]].total += 1;
  }

  return {
    rango: { desde: fechaLocal(desdeD), hasta: fechaLocal(hastaD) },
    kpis: {
      totalUsuarios,
      usuariosActivos,
      accesos: permitidos + denegados, // accesos dentro del rango
      permitidos,
      denegados,
      credencialesVigentes,
    },
    usuariosPorTipo: Object.values(porTipo),
    accesosPorDia: dias,
    accesosPorResultado: [
      { resultado: 'PERMITIDO', total: permitidos },
      { resultado: 'DENEGADO', total: denegados },
    ],
    credencialesPorEstado: credencialesPorEstado.map((c) => ({ estado: c.estado, total: c._count._all })),
  };
}

module.exports = { obtenerStats };
