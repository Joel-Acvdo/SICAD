'use client';

// Caseta: valida el acceso de un alumno buscándolo por nombre (cuando no trae su QR).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import { cargarAccesosYCredenciales, registrarAcceso } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import TabsCaseta from '@/components/TabsCaseta';
import Badge from '@/components/Badge';
import { nombreCompleto } from '@/lib/format';

export default function ValidarAlumno() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista } = useSelector((s) => s.users);
  const { credenciales } = useSelector((s) => s.access);

  const [q, setQ] = useState('');
  const [registrado, setRegistrado] = useState(null); // {id, tipo}

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario || (usuario.tipo !== 'SEGURIDAD' && usuario.tipo !== 'ADMINISTRATIVO')) router.push('/login-admin');
  }, [usuario, router]);

  if (!usuario) return null;

  const comunidad = lista.filter((u) => ['ALUMNO', 'DOCENTE', 'TRABAJADOR'].includes(u.tipo));
  const resultados = q.trim()
    ? comunidad.filter((u) =>
        nombreCompleto(u).toLowerCase().includes(q.toLowerCase()) ||
        u.matricula_empleado?.toLowerCase().includes(q.toLowerCase())
      )
    : [];

  const credDe = (id) => credenciales.find((c) => c.id_usuario === id);
  const vigente = (u) => u.estatus === 'ACTIVO' && credDe(u.id_usuario)?.estado === 'ACTIVA';

  const registrar = (u, tipo) => {
    const valido = vigente(u);
    dispatch(registrarAcceso({
      tipo_evento: tipo,
      resultado: valido ? 'PERMITIDO' : 'DENEGADO',
      punto_nombre: 'Entrada Principal (manual)',
      id_usuario: u.id_usuario,
    }));
    setRegistrado({ id: u.id_usuario, tipo, valido });
    setTimeout(() => setRegistrado(null), 2500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Caseta de Seguridad" subtitulo="Validar acceso" onSalir={() => { dispatch(logout()); router.push('/login-admin'); }} />
      <TabsCaseta />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-xl font-black text-marino">Validar acceso sin credencial</h1>
        <p className="mb-5 text-sm text-slate-500">
          Busca al alumno por nombre o matrícula cuando no pueda presentar su credencial (por ejemplo, celular sin batería).
        </p>

        <div className="relative mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o matrícula…"
            className="w-full rounded-xl border border-platino bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-azulmedio"
          />
          <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z" /></svg>
        </div>

        {q.trim() && resultados.length === 0 && (
          <p className="rounded-xl border border-platino-light bg-white px-4 py-6 text-center text-sm text-slate-400">Sin coincidencias.</p>
        )}

        <div className="space-y-3">
          {resultados.map((u) => {
            const ok = vigente(u);
            const reg = registrado?.id === u.id_usuario ? registrado : null;
            return (
              <div key={u.id_usuario} className="rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-platino-light text-slate-400">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-marino">{nombreCompleto(u)}</p>
                    <p className="text-xs text-slate-500">{u.matricula_empleado} · {u.carrera || u.tipo}</p>
                  </div>
                  <Badge tono={ok ? 'verde' : 'rojo'}>{ok ? 'Credencial vigente' : 'No vigente'}</Badge>
                </div>

                {reg ? (
                  <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold ${reg.valido ? 'bg-green-100 text-verde' : 'bg-red-100 text-rojo'}`}>
                    {reg.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} {reg.valido ? 'registrada' : 'denegada'} · queda en la bitácora.
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button onClick={() => registrar(u, 'ENTRADA')} className="rounded-xl bg-azulmedio py-2.5 text-sm font-bold text-white transition hover:bg-marino">Registrar entrada</button>
                    <button onClick={() => registrar(u, 'SALIDA')} className="rounded-xl border border-platino bg-white py-2.5 text-sm font-bold text-marino transition hover:bg-platino-light">Registrar salida</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-slate-400">El acceso manual queda registrado en la bitácora igual que un acceso por QR.</p>
      </main>
    </div>
  );
}
