'use client';

// Terminal del lector de QR en un punto de acceso (validación en tiempo real).
// Escanea el código QR de la credencial con la cámara del dispositivo y valida
// contra el backend: la respuesta decide ACCESO PERMITIDO o DENEGADO y lo registra.
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import { validarAccesoQr } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import QrScanner from '@/components/QrScanner';
import { horaActual, nombreCompleto } from '@/lib/format';

const PUNTO = 'Entrada Principal';

export default function TerminalAcceso() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista } = useSelector((s) => s.users);

  const [estado, setEstado] = useState('idle'); // idle | verificando | permitido | denegado
  const [persona, setPersona] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [camaraError, setCamaraError] = useState('');
  const [manual, setManual] = useState(''); // código escrito a mano (respaldo sin cámara)

  // Anti-rebote: evita reprocesar el mismo QR muchas veces por segundo.
  const ultimoRef = useRef({ codigo: '', t: 0 });
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  useEffect(() => {
    dispatch(cargarUsuarios());
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

  // Valida un código (venga de la cámara o escrito a mano) contra el backend.
  const validar = async (codigo) => {
    const texto = (codigo || '').trim();
    if (!texto) return;
    // Solo se procesa si la terminal está en reposo.
    if (estadoRef.current !== 'idle' && estadoRef.current !== 'verificando') return;

    setEstado('verificando');
    setPersona(null);
    setMotivo('');
    try {
      // La terminal solo registra ENTRADAS (no hay salidas en el sistema).
      const { resultado, motivo, acceso } = await dispatch(
        validarAccesoQr({ codigo_qr: texto, punto_nombre: PUNTO, tipo_evento: 'ENTRADA' })
      ).unwrap();

      // Enriquece los datos de la persona con la lista de usuarios si está disponible.
      const uAcc = acceso?.usuario;
      const uFull = uAcc ? lista.find((x) => x.id_usuario === uAcc.id_usuario) : null;
      setPersona(uFull || uAcc || null);
      setMotivo(motivo || '');
      setEstado(resultado === 'PERMITIDO' ? 'permitido' : 'denegado');
    } catch {
      setMotivo('No se pudo validar el código. Intenta de nuevo.');
      setEstado('denegado');
    }
    // Vuelve a reposo tras mostrar el resultado.
    setTimeout(() => setEstado('idle'), 3500);
  };

  // Callback de la cámara: filtra lecturas repetidas del mismo código.
  const onScan = (texto) => {
    const ahora = Date.now();
    const { codigo, t } = ultimoRef.current;
    if (texto === codigo && ahora - t < 4000) return; // mismo QR muy seguido
    if (estadoRef.current !== 'idle') return; // ocupado mostrando un resultado
    ultimoRef.current = { codigo: texto, t: ahora };
    validar(texto);
  };

  const enviarManual = (e) => {
    e.preventDefault();
    validar(manual);
    setManual('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        titulo="Vigilancia Caseta"
        subtitulo={`${PUNTO} · Registro de entradas`}
        onVolver={() => router.push('/caseta/validar')}
        onSalir={() => {
          dispatch(logout());
          router.push('/login-admin');
        }}
      />

      <main className="flex flex-1 flex-col items-center gap-6 p-4 py-8">
        <div className="relative flex min-h-[420px] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-3xl border border-platino-light bg-white p-6 text-center shadow-xl">
          {/* Lector de cámara: se mantiene SIEMPRE montado para no reiniciar la cámara.
              Los resultados se muestran encima como overlay. */}
          <div className="flex w-full flex-col items-center">
            <h2 className="mb-1 text-lg font-black text-marino">Terminal de acceso activa</h2>
            <p className="mb-4 max-w-xs text-xs leading-relaxed text-slate-500">
              Coloca el código QR de la credencial frente a la cámara.
            </p>
            {!camaraError ? (
              <QrScanner onScan={onScan} onError={setCamaraError} />
            ) : (
              <div className="w-full rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-rojo">
                {camaraError}
              </div>
            )}
          </div>

          {estado === 'verificando' && (
            <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center bg-white/95">
              <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-platino-light border-t-azulmedio" />
              <h2 className="text-lg font-bold text-marino">Verificando…</h2>
              <p className="mt-1 text-xs text-slate-500">Leyendo credencial y validando estatus…</p>
            </div>
          )}

          {estado === 'permitido' && (
            <div className="absolute inset-0 flex w-full animate-fade-in flex-col items-center justify-center bg-white/98 p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-verde text-white shadow-lg ring-8 ring-green-100">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-black text-verde">ACCESO PERMITIDO</h2>
              <p className="mt-1 text-sm font-bold text-marino">{persona ? nombreCompleto(persona) : 'Credencial válida'}</p>
              <div className="mt-6 w-full max-w-xs space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs">
                <Fila k="Matrícula / ID" v={persona?.matricula_empleado || '—'} />
                <Fila k="Evento" v="Entrada" />
                <Fila k="Hora" v={horaActual()} ultimo />
              </div>
            </div>
          )}

          {estado === 'denegado' && (
            <div className="absolute inset-0 flex w-full animate-fade-in flex-col items-center justify-center bg-white/98 p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rojo text-white shadow-lg ring-8 ring-red-100">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-black text-rojo">ACCESO DENEGADO</h2>
              <p className="mt-1 text-sm font-bold text-marino">{persona ? nombreCompleto(persona) : 'Credencial inválida'}</p>
              <div className="mt-6 w-full max-w-xs space-y-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-xs">
                <Fila k="Motivo" v={motivo || 'Credencial no válida'} />
                <Fila k="Hora" v={horaActual()} ultimo />
                <p className="pt-1 text-[11px] text-rojo">Intento registrado en la bitácora.</p>
              </div>
            </div>
          )}
        </div>

        {/* Respaldo: capturar el código a mano (dispositivos sin cámara o pruebas) */}
        <form onSubmit={enviarManual} className="flex w-full max-w-md items-end gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sin cámara · captura el código
            </span>
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Ej. QR-UP230571-XYZ"
              className="w-full rounded-xl border border-platino bg-white px-3 py-2.5 text-sm outline-none transition focus:border-azulmedio"
            />
          </label>
          <button
            type="submit"
            disabled={!manual.trim() || estado === 'verificando'}
            className="rounded-xl bg-azulmedio px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-marino disabled:opacity-50"
          >
            Validar
          </button>
        </form>
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
