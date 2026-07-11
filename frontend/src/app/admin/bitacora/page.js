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

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario || usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
  }, [usuario, router]);

  if (!usuario) return null;

  const userDe = (id) => lista.find((u) => u.id_usuario === id);
  const denegados = accesos.filter((a) => a.resultado === 'DENEGADO').length;

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Servicios Escolares" subtitulo="Bitácora y reportes" onVolver={() => router.push('/admin/usuarios')} onSalir={() => { dispatch(logout()); router.push('/login-admin'); }} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Filtros */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-marino">Desde
              <input type="date" className="mt-1 block rounded-xl border border-platino bg-white px-3 py-2 text-sm outline-none focus:border-azulmedio" />
            </label>
            <label className="text-xs font-bold text-marino">Hasta
              <input type="date" className="mt-1 block rounded-xl border border-platino bg-white px-3 py-2 text-sm outline-none focus:border-azulmedio" />
            </label>
            <button className="rounded-xl bg-marino px-5 py-2.5 text-sm font-bold text-white transition hover:bg-marino-light">Filtrar</button>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-platino bg-white px-5 py-2.5 text-sm font-bold text-marino hover:bg-platino-light">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            Exportar
          </button>
        </div>

        {/* Estadísticas */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Stat valor={accesos.length} label="Accesos registrados" color="text-marino" />
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
              {accesos.map((a) => {
                const u = userDe(a.id_usuario);
                return (
                  <tr key={a.id_acceso} className="border-b border-platino-light last:border-0 hover:bg-platino-light/30">
                    <td className="px-5 py-3 font-bold text-marino">{u ? nombreCompleto(u) : 'Usuario'}</td>
                    <td className="px-5 py-3 text-slate-500">{u?.matricula_empleado || '—'}</td>
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
          {accesos.map((a) => {
            const u = userDe(a.id_usuario);
            return (
              <div key={a.id_acceso} className="flex items-center justify-between rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="font-bold text-marino">{u ? nombreCompleto(u) : 'Usuario'}</p>
                  <p className="text-xs text-slate-500">{a.punto_nombre} · {formatFechaHora(a.fecha_hora)}</p>
                </div>
                <Badge tono={a.resultado === 'PERMITIDO' ? 'verde' : 'rojo'}>{a.resultado === 'PERMITIDO' ? 'Permitido' : 'Denegado'}</Badge>
              </div>
            );
          })}
        </div>
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
