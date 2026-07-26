'use client';

// Caseta: valida el acceso de un alumno buscándolo por nombre (cuando no trae su QR).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import { cargarAccesosYCredenciales, registrarAcceso } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import TabsCaseta from '@/components/TabsCaseta';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { nombreCompleto, formatFechaHora } from '@/lib/format';

export default function ValidarAlumno() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista } = useSelector((s) => s.users);
  const { credenciales, accesos } = useSelector((s) => s.access);

  const [q, setQ] = useState('');
  const [registrado, setRegistrado] = useState(null); // {id, tipo}
  const [confirmDoble, setConfirmDoble] = useState(null); // {u, ult} aviso de doble entrada

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

  // Último evento (permitido) de una persona; la bitácora viene ordenada por fecha desc.
  const ultimoEventoDe = (id) =>
    accesos.find((a) => a.id_usuario === id && a.resultado === 'PERMITIDO') || null;

  // Registra la ENTRADA en la bitácora (el sistema solo maneja entradas).
  const doRegistrar = (u) => {
    const valido = vigente(u);
    dispatch(registrarAcceso({
      tipo_evento: 'ENTRADA',
      resultado: valido ? 'PERMITIDO' : 'DENEGADO',
      punto_nombre: 'Entrada Principal (manual)',
      id_usuario: u.id_usuario,
    }));
    setRegistrado({ id: u.id_usuario, valido });
    setTimeout(() => setRegistrado(null), 2500);
  };

  // MEJ-01: avisa si la persona ya registró una entrada HOY (evita el doble
  // registro por error). No lo bloquea: pide confirmar.
  const registrar = (u) => {
    const ult = ultimoEventoDe(u.id_usuario);
    const esDeHoy = ult && new Date(ult.fecha_hora).toDateString() === new Date().toDateString();
    if (esDeHoy) {
      setConfirmDoble({ u, ult });
      return;
    }
    doRegistrar(u);
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

        {/* Lector de QR por cámara (terminal en /acceso). Ideal desde el celular. */}
        <Link
          href="/acceso"
          className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-marino py-3.5 text-sm font-bold text-white shadow transition hover:bg-marino-light"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V5a1 1 0 011-1h2M4 17v2a1 1 0 001 1h2m10-16h2a1 1 0 011 1v2m-3 13h2a1 1 0 001-1v-2M8 8h3v3H8V8zm0 5h3m2-5h3v3m-3 2h3v3h-3v-3z" />
          </svg>
          Abrir lector QR (cámara)
        </Link>

        <p className="mb-6 text-center text-xs text-slate-500">o busca a la persona a mano si no trae su credencial:</p>

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
                    Entrada {reg.valido ? 'registrada' : 'denegada'} · queda en la bitácora.
                  </div>
                ) : (
                  <button onClick={() => registrar(u)} className="mt-3 w-full rounded-xl bg-azulmedio py-2.5 text-sm font-bold text-white transition hover:bg-marino">Registrar entrada</button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-slate-400">El acceso manual queda registrado en la bitácora igual que un acceso por QR.</p>
      </main>

      {/* MEJ-01: aviso de posible doble entrada sin salida previa */}
      {confirmDoble && (
        <Modal onClose={() => setConfirmDoble(null)}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A2 2 0 003.53 21h16.94a2 2 0 001.72-2.44L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-marino">Esta persona ya registró una entrada hoy</h3>
            <p className="mt-2 text-sm text-slate-500">
              <b>{nombreCompleto(confirmDoble.u)}</b> ya tiene una entrada registrada hoy
              ({formatFechaHora(confirmDoble.ult.fecha_hora)}). ¿Registrar otra de todos modos?
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
              <button
                onClick={() => { doRegistrar(confirmDoble.u); setConfirmDoble(null); }}
                className="w-full rounded-xl bg-azulmedio py-3 text-sm font-bold text-white hover:bg-marino"
              >
                Registrar entrada de todos modos
              </button>
              <button
                onClick={() => setConfirmDoble(null)}
                className="w-full rounded-xl py-2 text-sm font-semibold text-slate-400 hover:text-marino"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
