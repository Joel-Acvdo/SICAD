'use client';

// ============================================================================
// /ajustes — Ajustes del PROPIO usuario (comunidad).
//   1) Cambiar su contraseña (pide la actual; la nueva debe ser fuerte).
//   2) Reportar la credencial como perdida (si ya está revocada, se deshabilita
//      y se indica que la reactivación es en Servicios Escolares).
// ============================================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarMiCredencial, reportarPerdida } from '@/store/accessSlice';
import api from '@/lib/api';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Campo from '@/components/Campo';
import FotoPersona from '@/components/FotoPersona';
import { nombreCompleto } from '@/lib/format';

export default function Ajustes() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { miCredencial } = useSelector((s) => s.access);

  // Formulario de contraseña
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok'|'error', texto }

  const [modalPerdida, setModalPerdida] = useState(false);

  useEffect(() => {
    dispatch(cargarMiCredencial());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario) router.push('/login');
  }, [usuario, router]);

  if (!usuario) return null;

  const revocada = miCredencial?.estado === 'REVOCADA';

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setMensaje(null);
    if (nueva !== confirmar) {
      setMensaje({ tipo: 'error', texto: 'La confirmación no coincide con la contraseña nueva.' });
      return;
    }
    setGuardando(true);
    try {
      await api.patch('/auth/password', { actual, nueva });
      setMensaje({ tipo: 'ok', texto: 'Contraseña actualizada. Úsala en tu próximo inicio de sesión.' });
      setActual(''); setNueva(''); setConfirmar('');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo cambiar la contraseña.' });
    } finally {
      setGuardando(false);
    }
  };

  const confirmarPerdida = () => {
    dispatch(reportarPerdida());
    setModalPerdida(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        titulo="Ajustes"
        onVolver={() => router.push('/credencial')}
        onSalir={() => { dispatch(logout()); router.push('/login'); }}
      />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        {/* Quién soy */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
          <FotoPersona foto={usuario.foto} nombre={nombreCompleto(usuario)} semilla={usuario.matricula_empleado || usuario.correo} size={56} rounded="rounded-2xl" />
          <div className="min-w-0">
            <p className="truncate font-black text-marino">{nombreCompleto(usuario)}</p>
            <p className="truncate text-xs text-slate-500">{usuario.matricula_empleado || usuario.correo}</p>
          </div>
        </div>

        {/* 1) Cambiar contraseña */}
        <form onSubmit={cambiarPassword} className="rounded-2xl border border-platino-light bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-marino">Cambiar contraseña</h2>
          <p className="mb-4 text-xs text-slate-500">Mínimo 8 caracteres, combinando letras y números.</p>

          <div className="space-y-4">
            <Campo label="Contraseña actual" type="password" value={actual} onChange={(e) => setActual(e.target.value)} required />
            <Campo label="Contraseña nueva" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
            <Campo label="Confirmar contraseña nueva" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
          </div>

          {mensaje && (
            <p className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${mensaje.tipo === 'ok' ? 'bg-green-50 text-verde' : 'bg-red-50 text-rojo'}`}>
              {mensaje.texto}
            </p>
          )}

          <button
            type="submit"
            disabled={guardando || !actual || !nueva || !confirmar}
            className="mt-5 w-full rounded-xl bg-azulmedio py-3 text-sm font-bold text-white shadow transition hover:bg-marino disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </form>

        {/* 2) Reportar pérdida de la credencial */}
        <div className="mt-6 rounded-2xl border border-platino-light bg-white p-6 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-black text-marino">Mi credencial</h2>
            {miCredencial && (
              <Badge tono={miCredencial.estado === 'ACTIVA' ? 'verde' : miCredencial.estado === 'REVOCADA' ? 'rojo' : 'neutro'}>
                {miCredencial.estado}
              </Badge>
            )}
          </div>

          {revocada ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-rojo">
              Tu credencial ya está <b>revocada</b>. Para reactivarla, acude a <b>Servicios Escolares</b>:
              ahí pueden reemitirla con un código nuevo.
            </p>
          ) : (
            <p className="mb-4 text-xs text-slate-500">
              Si perdiste tu credencial o crees que alguien más la tiene, repórtala: se revoca de inmediato.
            </p>
          )}

          <button
            onClick={() => setModalPerdida(true)}
            disabled={revocada}
            className="mt-2 w-full rounded-xl border border-platino bg-white py-3 text-sm font-bold text-rojo transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reportar pérdida
          </button>
        </div>
      </main>

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
              Se <b>revocará de inmediato</b> y para reactivarla tendrás que acudir a <b>Servicios Escolares</b>.
            </p>
            <div className="mt-6 flex w-full gap-3">
              <button onClick={() => setModalPerdida(false)} className="flex-1 rounded-xl border border-platino bg-white py-3 text-sm font-bold text-marino hover:bg-platino-light">Cancelar</button>
              <button onClick={confirmarPerdida} className="flex-1 rounded-xl bg-rojo py-3 text-sm font-bold text-white hover:opacity-90">Sí, reportar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
