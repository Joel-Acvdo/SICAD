'use client';

// Caseta: bitácora en tiempo real de quién ha ingresado (verificación con foto).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import { cargarAccesosYCredenciales } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import TabsCaseta from '@/components/TabsCaseta';
import Badge from '@/components/Badge';
import { formatFechaHora, nombreCompleto } from '@/lib/format';

export default function BitacoraCaseta() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista } = useSelector((s) => s.users);
  const { accesos } = useSelector((s) => s.access);
  const [q, setQ] = useState('');

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario || (usuario.tipo !== 'SEGURIDAD' && usuario.tipo !== 'ADMINISTRATIVO')) router.push('/login-admin');
  }, [usuario, router]);

  if (!usuario) return null;

  const userDe = (id) => lista.find((u) => u.id_usuario === id);
  const filas = accesos
    .map((a) => ({ ...a, u: userDe(a.id_usuario) }))
    .filter((a) => !q.trim() || nombreCompleto(a.u).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Caseta de Seguridad" subtitulo="Bitácora de accesos" onSalir={() => { dispatch(logout()); router.push('/login-admin'); }} />
      <TabsCaseta />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-marino">Accesos de hoy</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-verde">
              <span className="h-2 w-2 animate-pulse rounded-full bg-verde" /> En vivo
            </span>
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre…" className="rounded-xl border border-platino bg-white px-4 py-2.5 text-sm outline-none focus:border-azulmedio sm:w-72" />
        </div>

        <div className="space-y-3">
          {filas.map((a) => (
            <div key={a.id_acceso} className="flex items-center gap-4 rounded-2xl border border-platino-light bg-white p-3 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-platino-light text-slate-400">
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-marino">{a.u ? nombreCompleto(a.u) : 'Usuario'}</p>
                <p className="text-xs text-slate-500">{a.punto_nombre} · {formatFechaHora(a.fecha_hora)}</p>
                <p className="text-[11px] text-slate-400">{a.u?.matricula_empleado || '—'} · {a.tipo_evento === 'ENTRADA' ? 'Entrada' : 'Salida'}</p>
              </div>
              <Badge tono={a.resultado === 'PERMITIDO' ? 'verde' : 'rojo'}>{a.resultado === 'PERMITIDO' ? 'Permitido' : 'Denegado'}</Badge>
            </div>
          ))}
          {filas.length === 0 && <p className="rounded-xl border border-platino-light bg-white px-4 py-6 text-center text-sm text-slate-400">Sin registros.</p>}
        </div>

        <p className="mt-6 text-xs text-slate-400">La foto permite verificar la identidad de quien ingresa. Se registran los accesos por NFC y los manuales.</p>
      </main>
    </div>
  );
}
