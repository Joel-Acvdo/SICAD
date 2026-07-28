'use client';

// Página principal del usuario: su credencial digital con QR + historial de accesos.
// Además "escucha" sus accesos (sondeo cada 4s): cuando la caseta le permite la
// entrada, la confirmación aparece también aquí, en su propio celular.
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarMiCredencial } from '@/store/accessSlice';
import api from '@/lib/api';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import QrCode from '@/components/QrCode'; // QR real (escaneable) de la credencial
import FotoPersona from '@/components/FotoPersona'; // foto real de la persona
import { formatVigencia, formatFechaHora, nombreCompleto } from '@/lib/format';

// Ícono de código QR (decorativo). Se dibuja como SVG en línea.
function IconoQR({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 2h6v6H2V2zm1.5 1.5v3h3v-3h-3zM2 16h6v6H2v-6zm1.5 1.5v3h3v-3h-3zM16 2h6v6h-6V2zm1.5 1.5v3h3v-3h-3zM16 16h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-4 4h2v2h-2v-2zm6 0h2v2h-2v-2zm-6-6h2v2h-2v-2zm2 2h2v2h-2v-2zm0-4h2v2h-2v-2zm2 2h2v2h-2v-2zM9 9h2v2H9V9zm2 2h2v2h-2v-2zm-2 2h2v2H9v-2zm4-4h2v2h-2V9zm-2-2h2v2h-2V7zm-2 0h2v2H9V7zm4-4h2v2h-2V3zm-2 2h2v2h-2V5z" />
    </svg>
  );
}

export default function CredencialDigital() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { miCredencial, misAccesos, inicializado } = useSelector((s) => s.access);

  const [mostrarQR, setMostrarQR] = useState(false);
  const [confirmAcceso, setConfirmAcceso] = useState(null); // entrada recién permitida

  // Último acceso conocido (para detectar los nuevos). null = aún no inicializado.
  const ultimoIdRef = useRef(null);

  useEffect(() => {
    dispatch(cargarMiCredencial());
  }, [dispatch]);

  // Sondeo: consulta "mis accesos" cada 4s. Si aparece un acceso NUEVO con
  // resultado PERMITIDO, muestra la confirmación de entrada en este dispositivo.
  useEffect(() => {
    if (!usuario) return;
    const tick = async () => {
      try {
        const { data } = await api.get('/accesos/mios');
        const top = data.accesos?.[0];
        if (ultimoIdRef.current === null) {
          ultimoIdRef.current = top?.id_acceso ?? 0; // primera lectura: solo memoriza
          return;
        }
        if (top && top.id_acceso > ultimoIdRef.current) {
          ultimoIdRef.current = top.id_acceso;
          dispatch(cargarMiCredencial()); // refresca el historial en pantalla
          // Se avisa tanto si le permitieron el paso como si se lo negaron:
          // el alumno debe enterarse en su propio celular.
          setMostrarQR(false); // cierra el QR: ya lo escanearon
          setConfirmAcceso(top);
        }
      } catch {} // sin red un momento: se reintenta en el siguiente tick
    };
    tick();
    // Con el QR abierto (esperando ser escaneado) consulta rápido; si no, relajado.
    const id = setInterval(tick, mostrarQR ? 1500 : 5000);
    return () => clearInterval(id);
  }, [usuario, dispatch, mostrarQR]);

  useEffect(() => {
    if (!usuario) router.push('/login');
  }, [usuario, router]);

  if (!usuario || !inicializado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gris-fondo">
        <p className="animate-pulse font-semibold text-marino">Cargando credencial…</p>
      </div>
    );
  }

  const cred = miCredencial || {
    codigo_qr: 'NO-ASIGNADO',
    estado: 'INACTIVA',
    fecha_vencimiento: new Date().toISOString(),
  };
  const tono = cred.estado === 'ACTIVA' ? 'verde' : cred.estado === 'REVOCADA' ? 'rojo' : 'neutro';

  const salir = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        dark
        titulo="SICAD"
        derecha={
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold sm:inline">Hola, {usuario.nombre}</span>
            <button
              onClick={() => router.push('/ajustes')}
              aria-label="Ajustes"
              title="Ajustes"
              className="rounded-lg border border-white/20 bg-white/10 p-2 transition hover:bg-white hover:text-marino"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 4.06c.4-1.68 2.92-1.68 3.32 0a1.72 1.72 0 002.57 1.06c1.48-.9 3.26.88 2.36 2.36a1.72 1.72 0 001.06 2.57c1.68.4 1.68 2.92 0 3.32a1.72 1.72 0 00-1.06 2.57c.9 1.48-.88 3.26-2.36 2.36a1.72 1.72 0 00-2.57 1.06c-.4 1.68-2.92 1.68-3.32 0a1.72 1.72 0 00-2.57-1.06c-1.48.9-3.26-.88-2.36-2.36a1.72 1.72 0 00-1.06-2.57c-1.68-.4-1.68-2.92 0-3.32a1.72 1.72 0 001.06-2.57c-.9-1.48.88-3.26 2.36-2.36.97.59 2.24.07 2.57-1.06z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              onClick={salir}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white hover:text-marino"
            >
              Salir
            </button>
          </div>
        }
      />

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-start gap-8 px-4 py-8 md:grid-cols-2 md:py-12">
        {/* Credencial + acciones */}
        <section className="flex flex-col items-center">
          <div className="flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-gradient-to-br from-marino-dark to-marino-light p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black tracking-wide">SICAD</p>
                <p className="text-[9px] font-bold tracking-widest text-platino">CREDENCIAL DIGITAL · UPA</p>
              </div>
              <IconoQR className="h-7 w-7 text-platino" />
            </div>

            <div className="flex items-center gap-4">
              {/* Foto real del alumno (misma persona = misma foto) */}
              <FotoPersona
                foto={usuario.foto}
                nombre={nombreCompleto(usuario)}
               
                size={64}
                rounded="rounded-2xl"
                className="border border-white/20"
              />
              <div className="min-w-0">
                <h4 className="truncate font-black leading-tight">{nombreCompleto(usuario)}</h4>
                <p className="truncate text-[11px] text-platino">{usuario.carrera || 'Comunidad Universitaria'}</p>
                <p className="mt-0.5 text-[11px]">Matrícula: {usuario.matricula_empleado || 'S/N'}</p>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <Badge tono={tono}>{cred.estado}</Badge>
                <p className="text-[11px] text-platino">Vigencia: {formatVigencia(cred.fecha_vencimiento)}</p>
              </div>
              {/* QR real: codifica el código de la credencial */}
              <QrCode value={cred.codigo_qr} size={52} />
            </div>
          </div>

          {/* Acción principal. Reportar la pérdida vive en Ajustes (⚙ arriba),
              para no dejar una acción destructiva junto al botón de uso diario. */}
          <div className="mt-5 w-full max-w-sm">
            {/* BUG-A: cuando la credencial no está activa, el botón se ve
                claramente inhabilitado y dice por qué (ya no es un botón muerto). */}
            <button
              onClick={() => setMostrarQR(true)}
              disabled={cred.estado !== 'ACTIVA'}
              title={cred.estado !== 'ACTIVA' ? 'Tu credencial no está activa' : 'Mostrar tu código QR'}
              className={`w-full rounded-xl py-3 text-sm font-bold shadow transition ${
                cred.estado === 'ACTIVA'
                  ? 'bg-azulmedio text-white hover:bg-marino'
                  : 'cursor-not-allowed border border-platino bg-platino-light text-slate-400 shadow-none'
              }`}
            >
              {cred.estado === 'ACTIVA' ? 'Mostrar código QR' : 'QR no disponible'}
            </button>
          </div>

          {/* Credencial ya revocada: la reactivación es presencial */}
          {cred.estado === 'REVOCADA' && (
            <p className="mt-3 w-full max-w-sm rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-medium text-rojo">
              Tu credencial está <b>revocada</b>. Acude a <b>Servicios Escolares</b> para que la reactiven.
            </p>
          )}
        </section>

        {/* Historial de accesos */}
        <section>
          <h2 className="mb-3 text-sm font-black text-marino">Accesos recientes</h2>
          <div className="overflow-hidden rounded-2xl border border-platino-light bg-white shadow-sm">
            {misAccesos.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Sin accesos registrados.</p>
            )}
            {misAccesos.map((a) => (
              <div key={a.id_acceso} className="flex items-center justify-between border-b border-platino-light px-4 py-3 last:border-0">
                <div>
                  <p className="text-sm font-bold text-marino">{a.punto_nombre}</p>
                  <p className="text-xs text-slate-400">
                    {formatFechaHora(a.fecha_hora)} · {a.tipo_evento === 'ENTRADA' ? 'Entrada' : 'Salida'}
                  </p>
                </div>
                <Badge tono={a.resultado === 'PERMITIDO' ? 'verde' : 'rojo'}>
                  {a.resultado === 'PERMITIDO' ? 'Permitido' : 'Denegado'}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Resultado en el celular del alumno: la caseta acaba de escanear su QR.
          Verde = entrada registrada · Rojo = acceso denegado (con el motivo). */}
      {confirmAcceso && (() => {
        const permitido = confirmAcceso.resultado === 'PERMITIDO';
        return (
          <div className={`fixed inset-0 z-50 flex animate-fade-in flex-col items-center justify-center p-6 text-center text-white ${permitido ? 'bg-verde' : 'bg-rojo'}`}>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-8 ring-white/10">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                {permitido
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />}
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-wide">
              {permitido ? 'ENTRADA REGISTRADA' : 'ACCESO DENEGADO'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-white/90">
              {permitido ? `Bienvenido, ${usuario.nombre} 👋` : 'No puedes ingresar al campus'}
            </p>
            <div className="mt-6 w-full max-w-xs space-y-2 rounded-2xl bg-white/15 p-4 text-left text-sm">
              <div className="flex justify-between"><span className="text-white/75">Punto:</span><span className="font-bold">{confirmAcceso.punto_nombre}</span></div>
              <div className="flex justify-between"><span className="text-white/75">Fecha y hora:</span><span className="font-bold">{formatFechaHora(confirmAcceso.fecha_hora)}</span></div>
            </div>
            {!permitido && (
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/90">
                Tu credencial no está vigente. Acude a <b>Servicios Escolares</b> para regularizar tu situación.
              </p>
            )}
            <button
              onClick={() => setConfirmAcceso(null)}
              className={`mt-8 w-full max-w-xs rounded-xl bg-white py-3 font-bold shadow-lg ${permitido ? 'text-verde' : 'text-rojo'}`}
            >
              Entendido
            </button>
          </div>
        );
      })()}

      {/* Modal: mostrar el QR grande para escanear en el punto de acceso */}
      {mostrarQR && (
        <Modal onClose={() => setMostrarQR(false)}>
          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-black text-marino">Tu código QR de acceso</h3>
            <p className="mt-1 text-sm text-slate-500">Preséntalo ante la cámara o el lector de la terminal de acceso.</p>
            {/* QR grande para escanear en el punto de acceso */}
            <div className="mt-4">
              <QrCode value={cred.codigo_qr} size={200} />
            </div>
            <p className="mt-3 rounded-lg bg-platino-light px-4 py-2 font-mono text-[11px] text-marino">{cred.codigo_qr}</p>
            <button
              onClick={() => setMostrarQR(false)}
              className="mt-5 w-full rounded-xl bg-marino py-3 font-bold text-white"
            >
              Listo
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
