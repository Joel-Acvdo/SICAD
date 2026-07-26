'use client';

// Servicios Escolares: bitácora y reportes de accesos (auditoría con filtros y estadísticas).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import { cargarAccesosYCredenciales } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import { formatFechaHora, nombreCompleto } from '@/lib/format';

export default function BitacoraServicios() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista } = useSelector((s) => s.users);
  const { accesos, visitantes } = useSelector((s) => s.access);

  // Filtro por rango de fechas: se captura en los inputs (borrador) y se aplica al pulsar "Filtrar".
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [rango, setRango] = useState({ desde: '', hasta: '' });

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario || usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
  }, [usuario, router]);

  if (!usuario) return null;

  const userDe = (id) => lista.find((u) => u.id_usuario === id);

  // Aplica el rango a un acceso (día completo: 00:00 → 23:59).
  const dentroRango = (fecha) => {
    const t = new Date(fecha).getTime();
    if (rango.desde && t < new Date(`${rango.desde}T00:00:00`).getTime()) return false;
    if (rango.hasta && t > new Date(`${rango.hasta}T23:59:59.999`).getTime()) return false;
    return true;
  };
  const accesosFiltrados = accesos.filter((a) => dentroRango(a.fecha_hora));
  const denegados = accesosFiltrados.filter((a) => a.resultado === 'DENEGADO').length;

  const aplicarFiltro = () => setRango({ desde, hasta });
  const limpiarFiltro = () => { setDesde(''); setHasta(''); setRango({ desde: '', hasta: '' }); };
  const hayFiltro = !!(rango.desde || rango.hasta);

  // Atajo "Solo hoy": llena ambas fechas con el día en curso y aplica de una vez.
  const hoyStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const soloHoy = () => { const h = hoyStr(); setDesde(h); setHasta(h); setRango({ desde: h, hasta: h }); };
  const filtroEsHoy = rango.desde === hoyStr() && rango.hasta === hoyStr();

  // Nombre a mostrar: comunidad (usuario) o externo (persona_nombre del acceso).
  const nombreDe = (a, u) => (u ? nombreCompleto(u) : a.persona_nombre || a.visitante?.nombre || 'Externo');

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Servicios Escolares" subtitulo="Bitácora y reportes" onVolver={() => router.push('/admin/dashboard')} onSalir={() => { dispatch(logout()); router.push('/login-admin'); }} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Filtros por fecha */}
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-marino">Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 block rounded-xl border border-platino bg-white px-3 py-2 text-sm outline-none focus:border-azulmedio" />
          </label>
          <label className="text-xs font-bold text-marino">Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 block rounded-xl border border-platino bg-white px-3 py-2 text-sm outline-none focus:border-azulmedio" />
          </label>
          <button onClick={aplicarFiltro} className="rounded-xl bg-marino px-5 py-2.5 text-sm font-bold text-white transition hover:bg-marino-light">Filtrar</button>
          <button
            onClick={soloHoy}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${filtroEsHoy ? 'bg-azulmedio text-white' : 'border border-platino bg-white text-marino hover:bg-platino-light'}`}
          >
            Solo hoy
          </button>
          {hayFiltro && (
            <button onClick={limpiarFiltro} className="rounded-xl border border-platino bg-white px-4 py-2.5 text-sm font-bold text-marino hover:bg-platino-light">Limpiar</button>
          )}
        </div>

        {/* Estadísticas (reflejan el rango filtrado) */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Stat valor={accesosFiltrados.length} label="Accesos registrados" color="text-marino" />
          <Stat valor={denegados} label="Accesos denegados" color="text-rojo" />
          <Stat valor={visitantes.length} label="Visitantes externos" color="text-verde" />
        </div>

        {/* Tabla */}
        <div className="hidden overflow-hidden rounded-2xl border border-platino-light bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-marino text-xs font-bold text-white">
              <tr>
                <th className="px-5 py-3">Persona</th>
                <th className="px-5 py-3">Matrícula</th>
                <th className="px-5 py-3">Punto</th>
                <th className="px-5 py-3">Fecha y hora</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {accesosFiltrados.map((a) => {
                const u = userDe(a.id_usuario);
                return (
                  <tr key={a.id_acceso} className="border-b border-platino-light last:border-0 hover:bg-platino-light/30">
                    <td className="px-5 py-3 font-bold text-marino">{nombreDe(a, u)}</td>
                    <td className="px-5 py-3 text-slate-500">{u?.matricula_empleado || (a.visitante ? 'Externo' : '—')}</td>
                    <td className="px-5 py-3 text-slate-500">{a.punto_nombre}</td>
                    <td className="px-5 py-3 text-slate-500">{formatFechaHora(a.fecha_hora)}</td>
                    <td className="px-5 py-3 text-slate-500">{a.tipo_evento === 'ENTRADA' ? 'Entrada' : 'Salida'}</td>
                    <td className="px-5 py-3"><Badge tono={a.resultado === 'PERMITIDO' ? 'verde' : 'rojo'}>{a.resultado === 'PERMITIDO' ? 'Permitido' : 'Denegado'}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lista (móvil) */}
        <div className="space-y-3 md:hidden">
          {accesosFiltrados.map((a) => {
            const u = userDe(a.id_usuario);
            return (
              <div key={a.id_acceso} className="flex items-center justify-between rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="font-bold text-marino">{nombreDe(a, u)}</p>
                  <p className="text-xs text-slate-500">{a.punto_nombre} · {formatFechaHora(a.fecha_hora)}</p>
                </div>
                <Badge tono={a.resultado === 'PERMITIDO' ? 'verde' : 'rojo'}>{a.resultado === 'PERMITIDO' ? 'Permitido' : 'Denegado'}</Badge>
              </div>
            );
          })}
        </div>

        {/* Estado vacío */}
        {accesosFiltrados.length === 0 && (
          <p className="rounded-2xl border border-platino-light bg-white px-4 py-8 text-center text-sm text-slate-400">
            {hayFiltro ? 'No hay accesos en el rango seleccionado.' : 'Aún no hay accesos registrados.'}
          </p>
        )}
      </main>
    </div>
  );
}

function Stat({ valor, label, color }) {
  return (
    <div className="rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
      <p className={`text-2xl font-black ${color}`}>{valor}</p>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
    </div>
  );
}
