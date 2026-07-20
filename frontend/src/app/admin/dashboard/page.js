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
    api
      .get('/stats')
      .then((res) => setStats(res.data))
      .catch((e) => setError(e.response?.data?.error || 'No se pudieron cargar las estadísticas.'))
      .finally(() => setCargando(false));
  }, []);

  // Serializa el SVG de la gráfica actual a PNG (fiable con SVG, a diferencia de un screenshot).
  const graficaAImg = async () => {
    const svg = document.querySelector('#grafica-principal svg');
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const xml = new XMLSerializer().serializeToString(svg);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const escala = 2;
    const canvas = document.createElement('canvas');
    canvas.width = (rect.width || 500) * escala;
    canvas.height = (rect.height || 260) * escala;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/png'), w: rect.width || 500, h: rect.height || 260 };
  };

  // Construye el PDF con jsPDF: encabezado + KPIs + tabla + la gráfica seleccionada.
  const descargarPDF = async () => {
    setGenerando(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      let y = 16;

      pdf.setFontSize(16);
      pdf.setTextColor(20, 39, 78);
      pdf.text('SICAD — Reporte del Dashboard', 14, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.setTextColor(110);
      pdf.text(`Servicios Escolares · ${new Date().toLocaleString('es-MX')}`, 14, y);
      y += 9;

      // KPIs
      pdf.setFontSize(12);
      pdf.setTextColor(20, 39, 78);
      pdf.text('Indicadores', 14, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.setTextColor(40);
      const k = stats.kpis;
      [
        `Usuarios activos: ${k.usuariosActivos}`,
        `Accesos hoy: ${k.accesosHoy}  (${k.permitidosHoy} permitidos, ${k.denegadosHoy} denegados)`,
        `Credenciales vigentes: ${k.credencialesVigentes}`,
        `Visitantes vigentes: ${k.visitantesVigentes}`,
      ].forEach((l) => {
        pdf.text('•  ' + l, 16, y);
        y += 5.5;
      });
      y += 4;

      // Gráfica seleccionada (embebida como imagen del SVG)
      const chart = await graficaAImg();
      pdf.setFontSize(12);
      pdf.setTextColor(20, 39, 78);
      pdf.text(`Gráfica: ${METRICAS[metrica].grafica}`, 14, y);
      y += 5;
      if (chart) {
        const imgW = w - 28;
        const imgH = (chart.h * imgW) / chart.w;
        pdf.addImage(chart.data, 'PNG', 14, y, imgW, imgH);
        y += imgH + 6;
      }

      // Tabla de datos de la métrica seleccionada (texto)
      pdf.setFontSize(10);
      pdf.setTextColor(40);
      const filas = tablaDatos();
      filas.forEach((f) => {
        pdf.text(f, 16, y);
        y += 5;
        if (y > 280) {
          pdf.addPage();
          y = 16;
        }
      });

      pdf.save(`reporte-sicad-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerando(false);
    }
  };

  // Filas de texto para la tabla del PDF, según la métrica seleccionada.
  const tablaDatos = () => {
    if (!stats) return [];
    if (metrica === 'usuarios') {
      return ['Tipo — Activos / Inactivos / Total', ...stats.usuariosPorTipo.map((u) => `  ${u.tipo}: ${u.activos} / ${u.inactivos} / ${u.total}`)];
    }
    if (metrica === 'accesos') {
      return ['Fecha — Accesos', ...stats.accesosPorDia.map((d) => `  ${d.fecha}: ${d.total}`)];
    }
    if (metrica === 'credenciales') {
      return ['Estado — Credenciales', ...stats.credencialesPorEstado.map((c) => `  ${c.estado}: ${c.total}`)];
    }
    return ['Estatus — Visitantes', ...stats.visitantesPorEstatus.map((v) => `  ${v.estatus}: ${v.total}`)];
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-marino">Panel de control</h1>
            <p className="text-xs font-medium text-slate-500">Elige un indicador para ver su gráfica.</p>
          </div>
          <Link href="/admin/usuarios" className="rounded-xl bg-platino-light px-4 py-2.5 text-xs font-bold text-marino transition hover:bg-platino">
            ← Gestión de usuarios
          </Link>
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
