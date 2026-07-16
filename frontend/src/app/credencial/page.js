'use client';

// Página principal del usuario: su credencial digital con QR + historial de accesos.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios } from '@/store/userSlice';
import { cargarAccesosYCredenciales, cambiarEstadoCredencial } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import QrCode from '@/components/QrCode'; // QR real (escaneable) de la credencial
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
  const { credenciales, accesos, inicializado } = useSelector((s) => s.access);

  const [modalPerdida, setModalPerdida] = useState(false);
  const [mostrarQR, setMostrarQR] = useState(false);

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);

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

  const cred = credenciales.find((c) => c.id_usuario === usuario.id_usuario) || {
    codigo_qr: 'NO-ASIGNADO',
    estado: 'INACTIVA',
    fecha_vencimiento: new Date().toISOString(),
  };
  const misAccesos = accesos.filter((a) => a.id_usuario === usuario.id_usuario);
  const tono = cred.estado === 'ACTIVA' ? 'verde' : cred.estado === 'REVOCADA' ? 'rojo' : 'neutro';

  const salir = () => {
    dispatch(logout());
    router.push('/login');
  };
  const confirmarPerdida = () => {
    dispatch(cambiarEstadoCredencial({ id_usuario: usuario.id_usuario, estado: 'REVOCADA' }));
    setModalPerdida(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        dark
        titulo="SICAD"
        derecha={
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold sm:inline">Hola, {usuario.nombre}</span>
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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <svg className="h-9 w-9 text-platino" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
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

          {/* Botones de acción */}
          <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
            <button
              onClick={() => setMostrarQR(true)}
              disabled={cred.estado !== 'ACTIVA'}
              className="rounded-xl bg-azulmedio py-3 text-sm font-bold text-white shadow transition hover:bg-marino disabled:opacity-50"
            >
              Mostrar código QR
            </button>
            <button
              onClick={() => setModalPerdida(true)}
              className="rounded-xl border border-platino bg-white py-3 text-sm font-bold text-marino transition hover:bg-platino-light"
            >
              Reportar pérdida
            </button>
          </div>
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

      {/* Modal: reportar pérdida */}
      {modalPerdida && (
        <Modal onClose={() => setModalPerdida(false)}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-rojo">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A2 2 0 003.53 21h16.94a2 2 0 001.72-2.44L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-marino">¿Reportar tu credencial como perdida?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Tu credencial se <b>revocará de inmediato</b> y no podrás ingresar hasta que Servicios Escolares
              emita una nueva.
            </p>
            <div className="mt-6 flex w-full gap-3">
              <button
                onClick={() => setModalPerdida(false)}
                className="flex-1 rounded-xl border border-platino bg-white py-3 text-sm font-bold text-marino hover:bg-platino-light"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPerdida}
                className="flex-1 rounded-xl bg-rojo py-3 text-sm font-bold text-white hover:opacity-90"
              >
                Sí, reportar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
