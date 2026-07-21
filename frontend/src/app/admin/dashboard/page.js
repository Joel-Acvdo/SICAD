'use client';

// ============================================================================
// /admin/dashboard — Panel de indicadores de Servicios Escolares.
// Consume GET /api/stats. KPIs SELECCIONABLES → la gráfica principal cambia
// según la métrica elegida. Filtro activo/inactivo para usuarios.
// Genera un reporte PDF (jsPDF) con KPIs, tabla y la gráfica embebida.
// ============================================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/lib/api';
import TopBar from '@/components/TopBar';

const AZUL = '#3F72BF';
const MARINO = '#14274E';
const COLOR_CRED = { ACTIVA: '#16A34A', REVOCADA: '#DC2626', VENCIDA: '#D97706', INACTIVA: '#94A3B8' };
const COLOR_VISIT = { VIGENTE: '#16A34A', EXPIRADO: '#94A3B8', CANCELADO: '#DC2626' };

// Configuración de cada métrica seleccionable (KPI + gráfica asociada).
const METRICAS = {
  usuarios: { label: 'Usuarios activos', valor: (k) => k.usuariosActivos, color: 'text-marino', grafica: 'Comunidad por tipo' },
  accesos: { label: 'Accesos hoy', valor: (k) => k.accesosHoy, color: 'text-azulmedio', grafica: 'Accesos por día (últimos 7)' },
  credenciales: { label: 'Credenciales vigentes', valor: (k) => k.credencialesVigentes, color: 'text-verde', grafica: 'Credenciales por estado' },
  visitantes: { label: 'Visitantes vigentes', valor: (k) => k.visitantesVigentes, color: 'text-marino', grafica: 'Visitantes por estatus' },
};

export default function Dashboard() {
  const router = useRouter();
  const { usuario } = useSelector((s) => s.auth);

  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [visitantes, setVisitantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [montado, setMontado] = useState(false);
  const [metrica, setMetrica] = useState('usuarios'); // KPI/gráfica seleccionada
  const [filtro, setFiltro] = useState('todos'); // todos | activos | inactivos (usuarios)

  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (usuario && usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
  }, [usuario, router]);
  useEffect(() => {
    Promise.all([api.get('/stats'), api.get('/usuarios'), api.get('/visitantes')])
      .then(([s, u, v]) => {
        setStats(s.data);
        setUsuarios(u.data.usuarios);
        setVisitantes(v.data.visitantes);
      })
      .catch((e) => setError(e.response?.data?.error || 'No se pudieron cargar las estadísticas.'))
      .finally(() => setCargando(false));
  }, []);

  // Dibuja una gráfica de barras horizontales NATIVA en el PDF (fiable, sin capturar SVG).
  const dibujarBarras = (pdf, datos, x, y, ancho, color) => {
    const max = Math.max(1, ...datos.map((d) => d.value));
    const barH = 6;
    const gap = 3.5;
    const labelW = 42;
    const barMaxW = ancho - labelW - 16;
    datos.forEach((d) => {
      pdf.setFontSize(9);
      pdf.setTextColor(70);
      pdf.text(String(d.label), x, y + barH - 1.5, { maxWidth: labelW - 2 });
      const bw = Math.max(0.6, (d.value / max) * barMaxW);
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.roundedRect(x + labelW, y, bw, barH, 1, 1, 'F');
      pdf.setTextColor(40);
      pdf.text(String(d.value), x + labelW + bw + 2, y + barH - 1.5);
      y += barH + gap;
    });
    return y;
  };

  // Construye el PDF con jsPDF + autotable: encabezado de color, KPIs, gráfica y
  // tablas (usuarios vigentes / no vigentes y visitantes vigentes).
  const descargarPDF = async () => {
    setGenerando(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();

      // Encabezado con barra azul marino
      pdf.setFillColor(20, 39, 78);
      pdf.rect(0, 0, w, 24, 'F');
      pdf.setTextColor(255);
      pdf.setFontSize(16);
      pdf.text('SICAD — Reporte del Dashboard', 14, 12);
      pdf.setFontSize(9);
      pdf.setTextColor(200, 210, 230);
      pdf.text(`Servicios Escolares · ${new Date().toLocaleString('es-MX')}`, 14, 18);

      let y = 32;

      // Resumen de KPIs
      const k = stats.kpis;
      pdf.setFontSize(10);
      pdf.setTextColor(40);
      pdf.text(
        `Usuarios activos: ${k.usuariosActivos}     Accesos hoy: ${k.accesosHoy}     Credenciales vigentes: ${k.credencialesVigentes}     Visitantes vigentes: ${k.visitantesVigentes}`,
        14, y
      );
      y += 9;

      // Gráfica (barras nativas) de la métrica seleccionada
      pdf.setFontSize(12);
      pdf.setTextColor(20, 39, 78);
      pdf.text(METRICAS[metrica].grafica, 14, y);
      y += 6;
      const datosGraf =
        metrica === 'usuarios'
          ? stats.usuariosPorTipo.map((u) => ({ label: u.tipo, value: filtro === 'activos' ? u.activos : filtro === 'inactivos' ? u.inactivos : u.total }))
          : metrica === 'accesos'
            ? stats.accesosPorDia.map((d) => ({ label: d.fecha.slice(5), value: d.total }))
            : metrica === 'credenciales'
              ? stats.credencialesPorEstado.map((c) => ({ label: c.estado, value: c.total }))
              : stats.visitantesPorEstatus.map((v) => ({ label: v.estatus, value: v.total }));
      y = dibujarBarras(pdf, datosGraf, 14, y, w - 28, [63, 114, 191]);
      y += 6;

      const nombre = (u) => `${u.nombre} ${u.apellidos}`;
      const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX') : '—');
      const vigentes = usuarios.filter((u) => u.estatus === 'ACTIVO');
      const noVigentes = usuarios.filter((u) => u.estatus !== 'ACTIVO');
      const visitVigentes = visitantes.filter((v) => v.estatus === 'VIGENTE');

      const tabla = (head, body, fill, startY) =>
        autoTable(pdf, {
          startY,
          head: [head],
          body: body.length ? body : [['— Sin registros —', ...head.slice(1).map(() => '')]],
          theme: 'striped',
          headStyles: { fillColor: fill, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
        });

      tabla(['Usuarios vigentes', 'Tipo', 'Matrícula'], vigentes.map((u) => [nombre(u), u.tipo, u.matricula_empleado || '—']), [22, 163, 74], y);
      tabla(['Usuarios NO vigentes', 'Tipo', 'Matrícula'], noVigentes.map((u) => [nombre(u), u.tipo, u.matricula_empleado || '—']), [148, 163, 184], pdf.lastAutoTable.finalY + 6);
      tabla(['Visitantes vigentes', 'Identificación', 'Empresa', 'Vence'], visitVigentes.map((v) => [v.nombre, v.identificacion, v.empresa || '—', fmt(v.fecha_fin)]), [63, 114, 191], pdf.lastAutoTable.finalY + 6);

      pdf.save(`reporte-sicad-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerando(false);
    }
  };

  if (!montado || !usuario) return null;

  // Datos de la gráfica de usuarios según el filtro activo/inactivo.
  const dataUsuarios = (stats?.usuariosPorTipo || []).map((u) => ({
    tipo: u.tipo,
    valor: filtro === 'activos' ? u.activos : filtro === 'inactivos' ? u.inactivos : u.total,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        titulo="Servicios Escolares"
        subtitulo="Dashboard"
        onSalir={() => router.push('/admin/usuarios')}
        derecha={
          <button
            onClick={descargarPDF}
            disabled={cargando || !!error || generando}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white hover:text-marino disabled:opacity-50"
          >
            {generando ? 'Generando…' : '↓ Descargar PDF'}
          </button>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link 
            href="/admin/usuarios"
            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-marino transition border border-platino/50 shadow-sm bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-marino">Panel de control</h1>
            <p className="text-xs font-medium text-slate-500">Elige un indicador para ver su gráfica.</p>
          </div>
        </div>

        {cargando && <p className="animate-pulse py-16 text-center font-semibold text-marino">Cargando indicadores…</p>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-6 text-center text-sm font-medium text-rojo">{error}</p>}

        {stats && (
          <div className="space-y-6">
            {/* KPIs seleccionables */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Object.entries(METRICAS).map(([id, m]) => {
                const activa = metrica === id;
                return (
                  <button
                    key={id}
                    onClick={() => setMetrica(id)}
                    className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                      activa ? 'border-azulmedio ring-2 ring-azulmedio/30 bg-white' : 'border-platino-light bg-white hover:border-azulmedio/50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500">{m.label}</p>
                    <p className={`mt-1 text-3xl font-black ${m.color}`}>{m.valor(stats.kpis)}</p>
                    {id === 'accesos' && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {stats.kpis.permitidosHoy} permitidos · {stats.kpis.denegadosHoy} denegados
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Gráfica principal (según la métrica seleccionada) */}
            <div className="rounded-2xl border border-platino-light bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black text-marino">{METRICAS[metrica].grafica}</h3>

                {/* Filtro activo/inactivo (solo aplica a usuarios) */}
                {metrica === 'usuarios' && (
                  <div className="flex gap-1 rounded-xl bg-platino-light p-1">
                    {[
                      { id: 'todos', t: 'Todos' },
                      { id: 'activos', t: 'Activos' },
                      { id: 'inactivos', t: 'Inactivos' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setFiltro(o.id)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${filtro === o.id ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'}`}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div id="grafica-principal">
                <ResponsiveContainer width="100%" height={300}>
                  {metrica === 'usuarios' ? (
                    <BarChart data={dataUsuarios}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="valor" fill={AZUL} radius={[6, 6, 0, 0]} name="Usuarios" />
                    </BarChart>
                  ) : metrica === 'accesos' ? (
                    <LineChart data={stats.accesosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="fecha" tickFormatter={(f) => f.slice(8) + '/' + f.slice(5, 7)} tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke={MARINO} strokeWidth={2.5} dot={{ r: 3 }} name="Accesos" />
                    </LineChart>
                  ) : metrica === 'credenciales' ? (
                    <PieChart>
                      <Pie data={stats.credencialesPorEstado} dataKey="total" nameKey="estado" innerRadius={65} outerRadius={110} paddingAngle={2}>
                        {stats.credencialesPorEstado.map((c) => (
                          <Cell key={c.estado} fill={COLOR_CRED[c.estado] || '#94A3B8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : (
                    <PieChart>
                      <Pie data={stats.visitantesPorEstatus} dataKey="total" nameKey="estatus" innerRadius={65} outerRadius={110} paddingAngle={2}>
                        {stats.visitantesPorEstatus.map((v) => (
                          <Cell key={v.estatus} fill={COLOR_VISIT[v.estatus] || '#94A3B8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
