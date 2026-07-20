'use client';

// ============================================================================
// /admin/dashboard — Panel de indicadores de Servicios Escolares.
// Consume GET /api/stats y muestra KPIs + gráficas dinámicas (Recharts).
// Permite descargar un reporte PDF (jsPDF + html2canvas).
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
import html2canvas from 'html2canvas';
import api from '@/lib/api';
import TopBar from '@/components/TopBar';

// Paleta de marca para las gráficas.
const AZUL = '#3F72BF';
const MARINO = '#14274E';
const COLOR_ESTADO = { ACTIVA: '#16A34A', REVOCADA: '#DC2626', VENCIDA: '#D97706', INACTIVA: '#94A3B8' };

export default function Dashboard() {
  const router = useRouter();
  const { usuario } = useSelector((s) => s.auth);

  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [montado, setMontado] = useState(false); // evita mismatch de hidratación (SSR vs cliente)

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

  // Genera el reporte PDF capturando el panel (incluye las gráficas) + encabezado.
  const descargarPDF = async () => {
    setGenerando(true);
    try {
      const el = document.getElementById('panel-dashboard');
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#f1f5f9' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(16);
      pdf.setTextColor(20, 39, 78);
      pdf.text('SICAD — Reporte del Dashboard', 14, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Servicios Escolares · ${new Date().toLocaleString('es-MX')}`, 14, 21);

      const imgW = w - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let position = 27;
      let heightLeft = imgH;
      pdf.addImage(img, 'PNG', 10, position, imgW, imgH);
      heightLeft -= pageH - position;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 10, position, imgW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`reporte-sicad-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerando(false);
    }
  };

  // No renderiza en el servidor (los datos y la sesión son del cliente) → sin hidratación cruzada.
  if (!montado || !usuario) return null;

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
            <p className="text-xs font-medium text-slate-500">Indicadores y métricas del control de acceso.</p>
          </div>
          <Link href="/admin/usuarios" className="rounded-xl bg-platino-light px-4 py-2.5 text-xs font-bold text-marino transition hover:bg-platino">
            ← Gestión de usuarios
          </Link>
        </div>

        {cargando && <p className="animate-pulse py-16 text-center font-semibold text-marino">Cargando indicadores…</p>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-6 text-center text-sm font-medium text-rojo">{error}</p>}

        {stats && (
          <div id="panel-dashboard" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi label="Usuarios activos" valor={stats.kpis.usuariosActivos} color="text-marino" />
              <Kpi
                label="Accesos hoy"
                valor={stats.kpis.accesosHoy}
                color="text-azulmedio"
                pie={`${stats.kpis.permitidosHoy} permitidos · ${stats.kpis.denegadosHoy} denegados`}
              />
              <Kpi label="Credenciales activas" valor={stats.kpis.credencialesActivas} color="text-verde" />
              <Kpi label="Visitantes vigentes" valor={stats.kpis.visitantesVigentes} color="text-marino" />
            </div>

            {/* Fila 2: barras (por tipo) + dona (credenciales) */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Tarjeta titulo="Comunidad por tipo">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.usuariosPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill={AZUL} radius={[6, 6, 0, 0]} name="Usuarios" />
                  </BarChart>
                </ResponsiveContainer>
              </Tarjeta>

              <Tarjeta titulo="Credenciales por estado">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={stats.credencialesPorEstado} dataKey="total" nameKey="estado" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {stats.credencialesPorEstado.map((c) => (
                        <Cell key={c.estado} fill={COLOR_ESTADO[c.estado] || '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Tarjeta>
            </div>

            {/* Fila 3: línea (accesos por día) + barras (por punto) */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Tarjeta titulo="Accesos por día (últimos 7)">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats.accesosPorDia}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="fecha" tickFormatter={(f) => f.slice(8) + '/' + f.slice(5, 7)} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke={MARINO} strokeWidth={2.5} dot={{ r: 3 }} name="Accesos" />
                  </LineChart>
                </ResponsiveContainer>
              </Tarjeta>

              <Tarjeta titulo="Accesos por punto de acceso">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.accesosPorPunto} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nombre" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill={AZUL} radius={[0, 6, 6, 0]} name="Accesos" />
                  </BarChart>
                </ResponsiveContainer>
              </Tarjeta>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, valor, color, pie }) {
  return (
    <div className="rounded-2xl border border-platino-light bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-black ${color}`}>{valor}</p>
      {pie && <p className="mt-1 text-[11px] text-slate-400">{pie}</p>}
    </div>
  );
}

function Tarjeta({ titulo, children }) {
  return (
    <div className="rounded-2xl border border-platino-light bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-black text-marino">{titulo}</h3>
      {children}
    </div>
  );
}
