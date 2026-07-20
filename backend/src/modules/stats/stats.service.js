// Lógica de negocio del dashboard: agrega métricas del sistema (Prisma groupBy/count).
const prisma = require('../../config/prisma');

// Formatea una fecha como YYYY-MM-DD en hora local (para agrupar por día).
function fechaLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function obtenerStats() {
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hace7 = new Date(hoyInicio);
  hace7.setDate(hace7.getDate() - 6); // ventana de 7 días (incluye hoy)

  const [
    usuariosPorTipoEstatus,
    credencialesPorEstado,
    accesosHoy,
    visitantesPorEstatus,
    usuariosActivos,
    credencialesVigentes,
    accesos7,
  ] = await Promise.all([
    prisma.usuario.groupBy({ by: ['tipo', 'estatus'], _count: { _all: true } }),
    prisma.credencial.groupBy({ by: ['estado'], _count: { _all: true } }),
    prisma.acceso.groupBy({ by: ['resultado'], where: { fecha_hora: { gte: hoyInicio } }, _count: { _all: true } }),
    prisma.visitante.groupBy({ by: ['estatus'], _count: { _all: true } }),
    prisma.usuario.count({ where: { estatus: 'ACTIVO' } }),
    prisma.credencial.count({ where: { estado: 'ACTIVA' } }),
    prisma.acceso.findMany({ where: { fecha_hora: { gte: hace7 } }, select: { fecha_hora: true } }),
  ]);

  // KPIs de accesos de hoy
  const permitidosHoy = accesosHoy.find((a) => a.resultado === 'PERMITIDO')?._count._all || 0;
  const denegadosHoy = accesosHoy.find((a) => a.resultado === 'DENEGADO')?._count._all || 0;
  const visitantesVigentes = visitantesPorEstatus.find((v) => v.estatus === 'VIGENTE')?._count._all || 0;

  // Usuarios por tipo, con desglose activos / inactivos (pivot del groupBy).
  const porTipo = {};
  for (const r of usuariosPorTipoEstatus) {
    if (!porTipo[r.tipo]) porTipo[r.tipo] = { tipo: r.tipo, activos: 0, inactivos: 0, total: 0 };
    const n = r._count._all;
    porTipo[r.tipo].total += n;
    if (r.estatus === 'ACTIVO') porTipo[r.tipo].activos += n;
    else porTipo[r.tipo].inactivos += n;
  }

  // Accesos por día (últimos 7): se inicializan los 7 días y se cuentan en JS.
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoyInicio);
    d.setDate(d.getDate() - i);
    dias.push({ fecha: fechaLocal(d), total: 0 });
  }
  const idx = Object.fromEntries(dias.map((d, i) => [d.fecha, i]));
  for (const a of accesos7) {
    const key = fechaLocal(new Date(a.fecha_hora));
    if (key in idx) dias[idx[key]].total += 1;
  }

  return {
    kpis: {
      usuariosActivos,
      accesosHoy: permitidosHoy + denegadosHoy,
      permitidosHoy,
      denegadosHoy,
      credencialesVigentes,
      visitantesVigentes,
    },
    usuariosPorTipo: Object.values(porTipo),
    credencialesPorEstado: credencialesPorEstado.map((c) => ({ estado: c.estado, total: c._count._all })),
    accesosPorDia: dias,
    visitantesPorEstatus: visitantesPorEstatus.map((v) => ({ estatus: v.estatus, total: v._count._all })),
  };
}

module.exports = { obtenerStats };
