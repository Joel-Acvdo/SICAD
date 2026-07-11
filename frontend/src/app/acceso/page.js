'use client';

// Terminal del lector NFC en un punto de acceso (validación en tiempo real).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import { cargarAccesosYCredenciales, registrarAcceso } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import { horaActual, nombreCompleto } from '@/lib/format';

export default function TerminalAcceso() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista } = useSelector((s) => s.users);

  const [estado, setEstado] = useState('idle'); // idle | verificando | permitido | denegado
  const [persona, setPersona] = useState(null);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);

  useEffect(() => {
    if (!usuario || (usuario.tipo !== 'SEGURIDAD' && usuario.tipo !== 'ADMINISTRATIVO')) {
      router.push('/login-admin');
    }
  }, [usuario, router]);

  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gris-fondo">
        <p className="animate-pulse font-semibold text-marino">Cargando…</p>
      </div>
    );
  }

  const simular = (resultado) => {
    setEstado('verificando');
    setTimeout(() => {
      const u =
        resultado === 'permitido'
          ? lista.find((x) => x.id_usuario === 1)
          : lista.find((x) => x.id_usuario === 4); // Luis: credencial revocada
      setPersona(u);
      if (resultado === 'denegado') setMotivo('Credencial revocada · usuario dado de baja');
      setEstado(resultado);
      dispatch(
        registrarAcceso({
          tipo_evento: 'ENTRADA',
          resultado: resultado === 'permitido' ? 'PERMITIDO' : 'DENEGADO',
          punto_nombre: 'Entrada Principal',
          id_usuario: u?.id_usuario,
        })
      );
    }, 1400);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        titulo="Vigilancia Caseta"
        subtitulo="Entrada Principal"
        onVolver={() => router.push('/caseta/validar')}
        onSalir={() => {
          dispatch(logout());
          router.push('/login-admin');
        }}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
        <div className="flex min-h-[420px] w-full max-w-md flex-col items-center justify-center rounded-3xl border border-platino-light bg-white p-8 text-center shadow-xl">
          {estado === 'idle' && (
            <div className="flex animate-fade-in flex-col items-center">
              <div className="mb-6 flex h-28 w-28 animate-pulse items-center justify-center rounded-full border border-marino/10 bg-marino/5 text-marino">
                <svg className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 8a8 8 0 0 1 0 8M10 6a12 12 0 0 1 0 12M14 18a12 12 0 0 0 0-12M18 16a8 8 0 0 0 0-8" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-marino">Terminal de acceso activa</h2>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
                Acerca la credencial digital NFC del teléfono o la tarjeta física al lector.
              </p>
            </div>
          )}

          {estado === 'verificando' && (
            <div className="flex animate-fade-in flex-col items-center">
              <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-platino-light border-t-azulmedio" />
              <h2 className="text-lg font-bold text-marino">Verificando…</h2>
              <p className="mt-1 text-xs text-slate-500">Leyendo credencial y validando estatus…</p>
            </div>
          )}

          {estado === 'permitido' && persona && (
            <div className="flex w-full animate-fade-in flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-verde text-white shadow-lg ring-8 ring-green-100">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-black text-verde">ACCESO PERMITIDO</h2>
              <p className="mt-1 text-sm font-bold text-marino">{nombreCompleto(persona)}</p>
              <div className="mt-6 w-full space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs">
                <Fila k="Matrícula / ID" v={persona.matricula_empleado} />
                <Fila k="Tipo" v={persona.tipo} />
                <Fila k="Hora" v={horaActual()} ultimo />
              </div>
            </div>
          )}

          {estado === 'denegado' && (
            <div className="flex w-full animate-fade-in flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rojo text-white shadow-lg ring-8 ring-red-100">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-black text-rojo">ACCESO DENEGADO</h2>
              <p className="mt-1 text-sm font-bold text-marino">{persona ? nombreCompleto(persona) : 'Credencial inválida'}</p>
              <div className="mt-6 w-full space-y-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-xs">
                <Fila k="Motivo" v={motivo} />
                <Fila k="Hora" v={horaActual()} ultimo />
                <p className="pt-1 text-[11px] text-rojo">Intento registrado en la bitácora.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Simulación de lectura</p>
          <div className="flex gap-3">
            <button
              onClick={() => simular('permitido')}
              className="rounded-xl bg-verde px-5 py-2.5 text-sm font-bold text-white shadow transition hover:opacity-90"
            >
              Acceso válido
            </button>
            <button
              onClick={() => simular('denegado')}
              className="rounded-xl bg-rojo px-5 py-2.5 text-sm font-bold text-white shadow transition hover:opacity-90"
            >
              Acceso denegado
            </button>
            {estado !== 'idle' && estado !== 'verificando' && (
              <button
                onClick={() => setEstado('idle')}
                className="rounded-xl border border-platino bg-white px-5 py-2.5 text-sm font-bold text-marino hover:bg-platino-light"
              >
                Reiniciar
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Fila({ k, v, ultimo }) {
  return (
    <div className={`flex justify-between py-1 ${ultimo ? '' : 'border-b border-slate-100'}`}>
      <span className="font-medium text-slate-500">{k}:</span>
      <span className="font-bold text-marino">{v}</span>
    </div>
  );
}
