'use client';

// Caseta: bitácora EN TIEMPO REAL de quién ha ingresado (verificación con foto).
// La lista se refresca sola cada 5s con el hook useAccesosEnVivo — sin recargar.
// (La bitácora de Admin se queda estática a propósito, por sus filtros.)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import useAccesosEnVivo from '@/hooks/useAccesosEnVivo';
import TopBar from '@/components/TopBar';
import TabsCaseta from '@/components/TabsCaseta';
import Badge from '@/components/Badge';
import FotoPersona from '@/components/FotoPersona';
import { formatFechaHora, nombreCompleto, coincide } from '@/lib/format';

export default function BitacoraCaseta() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista } = useSelector((s) => s.users);
  const [q, setQ] = useState('');

  // Bitácora viva: se actualiza sola cada 5 segundos (hook personalizado).
  const { accesos, ultimaActualizacion, hayNuevo } = useAccesosEnVivo({ intervalo: 5000 });

  useEffect(() => {
    dispatch(cargarUsuarios());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario || (usuario.tipo !== 'SEGURIDAD' && usuario.tipo !== 'ADMINISTRATIVO')) router.push('/login-admin');
  }, [usuario, router]);

  if (!usuario) return null;

  const userDe = (id) => lista.find((u) => u.id_usuario === id);
  // Nombre a mostrar: comunidad (usuario) o externo (visitante).
  const nombreDe = (a) => (a.u ? nombreCompleto(a.u) : a.visitante?.nombre || a.persona_nombre || 'Externo');
  // La caseta solo necesita el día en curso (incluye comunidad Y externos);
  // el historial completo con filtros vive en la bitácora de Admin.
  const esHoy = (f) => new Date(f).toDateString() === new Date().toDateString();
  const filas = accesos
    .filter((a) => esHoy(a.fecha_hora))
    .map((a) => ({ ...a, u: userDe(a.id_usuario) }))
    .filter((a) => coincide(nombreDe(a), q)); // ignora acentos y caracteres especiales

  const hora = (d) => d?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Caseta de Seguridad" subtitulo="Bitácora de accesos" onSalir={() => { dispatch(logout()); router.push('/login-admin'); }} />
      <TabsCaseta />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-marino">Accesos de hoy</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition ${hayNuevo ? 'bg-verde text-white' : 'bg-green-100 text-verde'}`}>
              <span className={`h-2 w-2 animate-pulse rounded-full ${hayNuevo ? 'bg-white' : 'bg-verde'}`} />
              {hayNuevo ? '¡Acceso nuevo!' : 'En vivo'}
            </span>
            {ultimaActualizacion && (
              <span className="text-[11px] text-slate-400">Actualizado {hora(ultimaActualizacion)}</span>
            )}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre…" className="rounded-xl border border-platino bg-white px-4 py-2.5 text-sm outline-none focus:border-azulmedio sm:w-72" />
        </div>

        <div className="space-y-3">
          {filas.map((a) => (
            <div key={a.id_acceso} className="flex items-center gap-4 rounded-2xl border border-platino-light bg-white p-3 shadow-sm">
              <FotoPersona foto={a.u?.foto} nombre={nombreDe(a)} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-marino">{nombreDe(a)}</p>
                <p className="text-xs text-slate-500">{a.punto_nombre} · {formatFechaHora(a.fecha_hora)}</p>
                <p className="text-[11px] text-slate-400">{a.u?.matricula_empleado || a.visitante?.empresa || 'Externo'} · Entrada</p>
              </div>
              <Badge tono={a.resultado === 'PERMITIDO' ? 'verde' : 'rojo'}>{a.resultado === 'PERMITIDO' ? 'Permitido' : 'Denegado'}</Badge>
            </div>
          ))}
          {filas.length === 0 && <p className="rounded-xl border border-platino-light bg-white px-4 py-6 text-center text-sm text-slate-400">Sin accesos el día de hoy.</p>}
        </div>

        <p className="mt-6 text-xs text-slate-400">La foto permite verificar la identidad de quien ingresa. Se registran los accesos por QR y los manuales.</p>
      </main>
    </div>
  );
}
