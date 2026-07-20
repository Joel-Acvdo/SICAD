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
    usuariosPorTipo,
    credencialesPorEstado,
    accesosHoy,
    visitantesVigentes,
    usuariosActivos,
    credencialesActivas,
    accesosPorPunto,
    puntos,
    accesos7,
  ] = await Promise.all([
    prisma.usuario.groupBy({ by: ['tipo'], _count: { _all: true } }),
    prisma.credencial.groupBy({ by: ['estado'], _count: { _all: true } }),
    prisma.acceso.groupBy({ by: ['resultado'], where: { fecha_hora: { gte: hoyInicio } }, _count: { _all: true } }),
    prisma.visitante.count({ where: { estatus: 'VIGENTE' } }),
    prisma.usuario.count({ where: { estatus: 'ACTIVO' } }),
    prisma.credencial.count({ where: { estado: 'ACTIVA' } }),
    prisma.acceso.groupBy({ by: ['id_punto'], _count: { _all: true } }),
    prisma.puntoAcceso.findMany({ select: { id_punto: true, nombre: true } }),
    prisma.acceso.findMany({ where: { fecha_hora: { gte: hace7 } }, select: { fecha_hora: true } }),
  ]);

  // KPIs de accesos de hoy
  const permitidosHoy = accesosHoy.find((a) => a.resultado === 'PERMITIDO')?._count._all || 0;
  const denegadosHoy = accesosHoy.find((a) => a.resultado === 'DENEGADO')?._count._all || 0;

  // Accesos por punto de acceso (mapea id → nombre)
  const nombrePunto = Object.fromEntries(puntos.map((p) => [p.id_punto, p.nombre]));
  const porPunto = accesosPorPunto.map((a) => ({ nombre: nombrePunto[a.id_punto] || 'Sin punto', total: a._count._all }));

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
      credencialesActivas,
      visitantesVigentes,
    },
    usuariosPorTipo: usuariosPorTipo.map((u) => ({ tipo: u.tipo, total: u._count._all })),
    credencialesPorEstado: credencialesPorEstado.map((c) => ({ estado: c.estado, total: c._count._all })),
    accesosPorPunto: porPunto,
    accesosPorDia: dias,
  };
}

module.exports = { obtenerStats };
