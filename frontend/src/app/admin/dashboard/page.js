'use client';

// ============================================================================
// /admin/dashboard — Página PRINCIPAL de Servicios Escolares.
// Al entrar muestra las 4 gráficas; al elegir un KPI se enfoca solo esa.
// Filtro de RANGO de fechas (Hoy / Últimos 7 días / personalizado) que afecta
// las métricas de accesos y los datos del PDF. Reporte PDF contextual con
// nombre por módulo (sicad_<modulo>_<fecha>.pdf).
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
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
const COLOR_RES = { PERMITIDO: '#16A34A', DENEGADO: '#DC2626' };
const IDS = ['usuarios', 'accesos', 'resultados', 'credenciales'];

const METRICAS = {
  usuarios: { label: 'Usuarios', valor: (k) => k.totalUsuarios, grafica: 'Comunidad por tipo', color: 'text-marino', rango: false },
  accesos: { label: 'Accesos', valor: (k) => k.accesos, grafica: 'Accesos por día', color: 'text-azulmedio', rango: true },
  resultados: { label: 'Accesos denegados', valor: (k) => k.denegados, grafica: 'Permitidos vs denegados', color: 'text-rojo', rango: true },
  credenciales: { label: 'Credenciales activas', valor: (k) => k.credencialesVigentes, grafica: 'Credenciales por estado', color: 'text-verde', rango: false },
};
// Nombre de archivo por módulo: sicad_<slug>_<fecha>.pdf
const SLUG = { usuarios: 'gestiondeusuarios', accesos: 'accesos', resultados: 'accesos_denegados', credenciales: 'credenciales' };

const fmtFecha = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Placeholder que se muestra cuando una gráfica no tiene datos en el periodo.
function SinDatos({ altura }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center" style={{ height: altura }}>
      <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 16v-4m4 4V9m4 7v-2" />
      </svg>
      <p className="text-sm font-semibold text-slate-400">No existen datos</p>
      <p className="text-xs text-slate-400">No hay registros para el periodo seleccionado.</p>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);

  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [accesos, setAccesos] = useState([]);
  const [credenciales, setCredenciales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [montado, setMontado] = useState(false);
  const [metrica, setMetrica] = useState(null); // null = ver todas
  const [filtro, setFiltro] = useState('todos'); // todos | activos | inactivos
  const [preset, setPreset] = useState('7d'); // hoy | 7d | custom
  const [cDesde, setCDesde] = useState('');
  const [cHasta, setCHasta] = useState('');

  // Rango de fechas efectivo (desde/hasta en 'YYYY-MM-DD') + etiqueta y slug para el archivo.
  const rango = useMemo(() => {
    const hoy = new Date();
    let ini, fin, etiqueta;
    if (preset === 'hoy') {
      ini = hoy; fin = hoy; etiqueta = `Hoy · ${fmtFecha(hoy)}`;
    } else if (preset === 'custom' && (cDesde || cHasta)) {
      ini = cDesde ? new Date(`${cDesde}T00:00:00`) : hoy;
      fin = cHasta ? new Date(`${cHasta}T00:00:00`) : hoy;
      etiqueta = `Del ${fmtFecha(ini)} al ${fmtFecha(fin)}`;
    } else {
      ini = new Date(hoy.getTime() - 6 * 86400000); fin = hoy; etiqueta = 'Últimos 7 días';
    }
    const desde = fmtFecha(ini);
    const hasta = fmtFecha(fin);
    const slug = desde === hasta ? desde : `${desde}_a_${hasta}`;
    return { desde, hasta, etiqueta, slug };
  }, [preset, cDesde, cHasta]);

  // Accesos por HORA (solo para el periodo "Hoy"): agrupa los accesos del día por
  // hora y muestra el tramo continuo del primer al último acceso registrado.
  const accesosPorHoraHoy = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hora: h, total: 0 }));
    accesos.forEach((a) => {
      const h = new Date(a.fecha_hora).getHours();
      if (h >= 0 && h < 24) buckets[h].total += 1;
    });
    const conDatos = buckets.filter((b) => b.total > 0);
    if (conDatos.length === 0) return [];
    const min = Math.min(...conDatos.map((b) => b.hora));
    const max = Math.max(...conDatos.map((b) => b.hora));
    return buckets.slice(min, max + 1).map((b) => ({ etiqueta: `${String(b.hora).padStart(2, '0')}:00`, total: b.total }));
  }, [accesos]);

  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (usuario && usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
  }, [usuario, router]);

  // Usuarios y credenciales son estado actual (no dependen del rango): se cargan una vez.
  useEffect(() => {
    Promise.all([api.get('/usuarios'), api.get('/credenciales')])
      .then(([u, c]) => { setUsuarios(u.data.usuarios); setCredenciales(c.data.credenciales); })
      .catch((e) => setError(e.response?.data?.error || 'No se pudieron cargar los datos.'));
  }, []);

  // Stats y accesos dependen del rango: se recargan cuando cambia.
  useEffect(() => {
    setCargando(true);
    const params = { desde: rango.desde, hasta: rango.hasta };
    Promise.all([api.get('/stats', { params }), api.get('/accesos', { params })])
      .then(([s, a]) => { setStats(s.data); setAccesos(a.data.accesos); })
      .catch((e) => setError(e.response?.data?.error || 'No se pudieron cargar las estadísticas.'))
      .finally(() => setCargando(false));
  }, [rango.desde, rango.hasta]);

  // Título de la gráfica: los accesos se muestran "por hora" cuando el periodo es Hoy.
  const tituloGrafica = (id) => (id === 'accesos' && preset === 'hoy' ? 'Accesos por hora' : METRICAS[id].grafica);

  // Datos que consume cada gráfica (según el filtro y el periodo activos).
  const datosGrafica = (id) => {
    if (id === 'usuarios') return stats.usuariosPorTipo.map((u) => ({ tipo: u.tipo, valor: filtro === 'activos' ? u.activos : filtro === 'inactivos' ? u.inactivos : u.total }));
    if (id === 'accesos') return preset === 'hoy' ? accesosPorHoraHoy : stats.accesosPorDia;
    if (id === 'resultados') return stats.accesosPorResultado;
    return stats.credencialesPorEstado;
  };

  // ¿Hay algo que graficar? (evita gráficas vacías con solo la leyenda).
  const hayDatos = (id) => {
    const d = datosGrafica(id);
    if (!d || d.length === 0) return false;
    if (id === 'usuarios') return d.some((x) => x.valor > 0);
    return d.some((x) => x.total > 0);
  };

  // Gráfica de una métrica para pantalla (Recharts).
  const grafica = (id, altura) => {
    if (!hayDatos(id)) return <SinDatos altura={altura} />;

    if (id === 'usuarios') {
      return (
        <ResponsiveContainer width="100%" height={altura}>
          <BarChart data={datosGrafica('usuarios')}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="valor" fill={AZUL} radius={[6, 6, 0, 0]} name="Usuarios" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (id === 'accesos') {
      const porHora = preset === 'hoy';
      return (
        <ResponsiveContainer width="100%" height={altura}>
          <LineChart data={datosGrafica('accesos')}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={porHora ? 'etiqueta' : 'fecha'}
              tickFormatter={porHora ? undefined : (f) => f.slice(8) + '/' + f.slice(5, 7)}
              tick={{ fontSize: 11 }}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke={MARINO} strokeWidth={2.5} dot={{ r: 3 }} name="Accesos" />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    const grande = altura > 280;
    if (id === 'resultados') {
      return (
        <ResponsiveContainer width="100%" height={altura}>
          <PieChart>
            <Pie data={stats.accesosPorResultado} dataKey="total" nameKey="resultado" innerRadius={grande ? 70 : 45} outerRadius={grande ? 110 : 72} paddingAngle={2}>
              {stats.accesosPorResultado.map((r) => (<Cell key={r.resultado} fill={COLOR_RES[r.resultado]} />))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={altura}>
        <PieChart>
          <Pie data={stats.credencialesPorEstado} dataKey="total" nameKey="estado" innerRadius={grande ? 70 : 45} outerRadius={grande ? 110 : 72} paddingAngle={2}>
            {stats.credencialesPorEstado.map((c) => (<Cell key={c.estado} fill={COLOR_CRED[c.estado] || '#94A3B8'} />))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Datos {label,value} para las barras del PDF.
  const datosBarras = (id) => {
    if (id === 'usuarios') return stats.usuariosPorTipo.map((u) => ({ label: u.tipo, value: filtro === 'activos' ? u.activos : filtro === 'inactivos' ? u.inactivos : u.total }));
    if (id === 'accesos') {
      return preset === 'hoy'
        ? accesosPorHoraHoy.map((d) => ({ label: d.etiqueta, value: d.total }))
        : stats.accesosPorDia.map((d) => ({ label: d.fecha.slice(5), value: d.total }));
    }
    if (id === 'resultados') return stats.accesosPorResultado.map((r) => ({ label: r.resultado, value: r.total }));
    return stats.credencialesPorEstado.map((c) => ({ label: c.estado, value: c.total }));
  };

  // Dibuja barras horizontales nativas en el PDF (fiable).
  const dibujarBarras = (pdf, datos, x, y, ancho, color) => {
    const max = Math.max(1, ...datos.map((d) => d.value));
    const barH = 6, gap = 3.5, labelW = 42, barMaxW = ancho - labelW - 16;
    datos.forEach((d) => {
      pdf.setFontSize(9); pdf.setTextColor(70);
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

  // Tabla contextual del PDF (autotable) según la métrica. Sin filas de relleno.
  const tablaPDF = (pdf, id, y) => {
    const nom = (u) => `${u.nombre} ${u.apellidos}`;
    const fecha = (d) => (d ? new Date(d).toLocaleString('es-MX') : '—');
    let head, body, fill;

    if (id === 'usuarios') {
      const lista = usuarios.filter((u) => (filtro === 'activos' ? u.estatus === 'ACTIVO' : filtro === 'inactivos' ? u.estatus !== 'ACTIVO' : true));
      head = ['Usuario', 'Tipo', 'Matrícula', 'Estado'];
      body = lista.map((u) => [nom(u), u.tipo, u.matricula_empleado || '—', u.estatus === 'ACTIVO' ? 'Vigente' : 'No vigente']);
      fill = [20, 39, 78];
    } else if (id === 'accesos') {
      head = ['Fecha', 'Persona', 'Punto', 'Resultado'];
      body = accesos.slice(0, 60).map((a) => [fecha(a.fecha_hora), a.persona_nombre || '—', a.punto_nombre || '—', a.resultado]);
      fill = [63, 114, 191];
    } else if (id === 'resultados') {
      head = ['Fecha', 'Persona', 'Punto'];
      body = accesos.filter((a) => a.resultado === 'DENEGADO').map((a) => [fecha(a.fecha_hora), a.persona_nombre || '—', a.punto_nombre || '—']);
      fill = [220, 38, 38];
    } else {
      const nomDe = Object.fromEntries(usuarios.map((u) => [u.id_usuario, nom(u)]));
      head = ['Usuario', 'Código', 'Estado', 'Vence'];
      body = credenciales.map((c) => [nomDe[c.id_usuario] || '—', c.codigo_qr, c.estado, new Date(c.fecha_vencimiento).toLocaleDateString('es-MX')]);
      fill = [22, 163, 74];
    }

    if (body.length === 0) {
      pdf.setFontSize(9); pdf.setTextColor(120);
      pdf.text('Sin datos en el rango seleccionado.', 14, y + 4);
      return y + 8;
    }
    autoTable(pdf, { startY: y, head: [head], body, theme: 'striped', headStyles: { fillColor: fill, fontStyle: 'bold' }, styles: { fontSize: 8.5, cellPadding: 2 }, margin: { left: 14, right: 14 } });
    return pdf.lastAutoTable.finalY;
  };

  const descargarPDF = () => {
    setGenerando(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      pdf.setFillColor(20, 39, 78);
      pdf.rect(0, 0, w, 24, 'F');
      pdf.setTextColor(255);
      pdf.setFontSize(16);
      pdf.text('SICAD — Reporte del Dashboard', 14, 12);
      pdf.setFontSize(9);
      pdf.setTextColor(200, 210, 230);
      pdf.text(`Servicios Escolares · ${rango.etiqueta} · generado ${new Date().toLocaleString('es-MX')}`, 14, 18);

      let y = 32;
      const k = stats.kpis;
      pdf.setFontSize(10);
      pdf.setTextColor(40);
      pdf.text(`Usuarios: ${k.totalUsuarios}     Accesos: ${k.accesos}     Denegados: ${k.denegados}     Credenciales activas: ${k.credencialesVigentes}`, 14, y);
      y += 10;

      const lista = metrica ? [metrica] : IDS;
      lista.forEach((id) => {
        if (y > 235) { pdf.addPage(); y = 18; }
        pdf.setFontSize(12);
        pdf.setTextColor(20, 39, 78);
        pdf.text(tituloGrafica(id), 14, y);
        y += 6;
        y = dibujarBarras(pdf, datosBarras(id), 14, y, w - 28, [63, 114, 191]) + 3;
        y = tablaPDF(pdf, id, y) + 10;
      });

      const base = metrica ? SLUG[metrica] : 'dashboard';
      pdf.save(`sicad_${base}_${rango.slug}.pdf`);
    } finally {
      setGenerando(false);
    }
  };

  if (!montado || !usuario) return null;

  const navBtn = 'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition';
  const presetBtn = (id, t) => (
    <button key={id} onClick={() => setPreset(id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${preset === id ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'}`}>{t}</button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        titulo="Servicios Escolares"
        subtitulo="Dashboard"
        derecha={
          <div className="flex items-center gap-2">
            <button
              onClick={descargarPDF}
              disabled={cargando || !!error || generando || !stats}
              className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white hover:text-marino disabled:opacity-50"
            >
              {generando ? 'Generando…' : '↓ Descargar PDF'}
            </button>
            <button onClick={() => { dispatch(logout()); router.push('/login-admin'); }} className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white hover:text-marino">
              Salir
            </button>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* Encabezado + navegación */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-marino">Panel de control</h1>
            <p className="text-xs font-medium text-slate-500">Indicadores del control de acceso. Elige un KPI para enfocar su gráfica.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/usuarios" className={`${navBtn} bg-marino text-white hover:bg-marino-light`}>Gestión de usuarios</Link>
            <Link href="/admin/usuarios/nuevo" className={`${navBtn} bg-azulmedio text-white hover:bg-marino`}><span className="text-base leading-none">+</span> Registrar</Link>
            <Link href="/admin/bitacora" className={`${navBtn} bg-platino-light text-marino hover:bg-platino`}>Ver bitácora</Link>
          </div>
        </div>

        {/* Filtro de rango de fechas (afecta accesos y el PDF) */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-platino-light bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black text-marino">Periodo:</span>
            <div className="flex gap-1 rounded-xl bg-platino-light p-1">
              {presetBtn('hoy', 'Hoy')}
              {presetBtn('7d', 'Últimos 7 días')}
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={cDesde} onChange={(e) => { setCDesde(e.target.value); setPreset('custom'); }} className="rounded-lg border border-platino bg-white px-2 py-1.5 text-xs outline-none focus:border-azulmedio" />
              <span className="text-xs text-slate-400">a</span>
              <input type="date" value={cHasta} onChange={(e) => { setCHasta(e.target.value); setPreset('custom'); }} className="rounded-lg border border-platino bg-white px-2 py-1.5 text-xs outline-none focus:border-azulmedio" />
            </div>
          </div>
          <span className="text-xs font-bold text-azulmedio">{rango.etiqueta}</span>
        </div>

        {cargando && <p className="animate-pulse py-16 text-center font-semibold text-marino">Cargando indicadores…</p>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-6 text-center text-sm font-medium text-rojo">{error}</p>}

        {stats && !cargando && (
          <div className="space-y-6">
            {/* KPIs seleccionables */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {IDS.map((id) => {
                const m = METRICAS[id];
                const activa = metrica === id;
                return (
                  <button
                    key={id}
                    onClick={() => setMetrica(activa ? null : id)}
                    className={`rounded-2xl border p-5 text-left shadow-sm transition ${activa ? 'border-azulmedio bg-white ring-2 ring-azulmedio/30' : 'border-platino-light bg-white hover:border-azulmedio/50'}`}
                  >
                    <p className="text-xs font-semibold text-slate-500">{m.label}{m.rango && <span className="text-slate-300"> · periodo</span>}</p>
                    <p className={`mt-1 text-3xl font-black ${m.color}`}>{m.valor(stats.kpis)}</p>
                    {id === 'accesos' && <p className="mt-1 text-[11px] text-slate-400">{stats.kpis.permitidos} permitidos · {stats.kpis.denegados} denegados</p>}
                  </button>
                );
              })}
            </div>

            {/* Gráficas: todas por defecto, o solo la seleccionada */}
            {metrica ? (
              <div className="rounded-2xl border border-platino-light bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-marino">{tituloGrafica(metrica)}</h3>
                  <div className="flex items-center gap-2">
                    {metrica === 'usuarios' && (
                      <div className="flex gap-1 rounded-xl bg-platino-light p-1">
                        {[{ id: 'todos', t: 'Todos' }, { id: 'activos', t: 'Activos' }, { id: 'inactivos', t: 'Inactivos' }].map((o) => (
                          <button key={o.id} onClick={() => setFiltro(o.id)} className={`rounded-lg px-3 py-1 text-xs font-bold transition ${filtro === o.id ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'}`}>{o.t}</button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setMetrica(null)} className="rounded-lg border border-platino bg-white px-3 py-1 text-xs font-bold text-marino hover:bg-platino-light">Ver todas</button>
                  </div>
                </div>
                <div>{grafica(metrica, 320)}</div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {IDS.map((id) => (
                  <button key={id} onClick={() => setMetrica(id)} className="rounded-2xl border border-platino-light bg-white p-5 text-left shadow-sm transition hover:border-azulmedio/50">
                    <h3 className="mb-3 text-sm font-black text-marino">{tituloGrafica(id)}</h3>
                    {grafica(id, 220)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
