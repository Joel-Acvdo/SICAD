'use client';

// ============================================================================
// /ajustes — Ajustes del PROPIO usuario (comunidad).
//   1) Cambiar su contraseña (pide la actual; la nueva debe ser fuerte).
//   2) Ver el estado de su credencial (solo informativo). El alumno NO puede
//      revocarla: los trámites de pérdida o reactivación son presenciales.
// ============================================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarMiCredencial } from '@/store/accessSlice';
import api from '@/lib/api';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import Campo from '@/components/Campo';
import FotoPersona from '@/components/FotoPersona';
import { nombreCompleto, formatVigencia } from '@/lib/format';

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


  useEffect(() => {
    dispatch(cargarMiCredencial());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario) router.push('/login');
  }, [usuario, router]);

  if (!usuario) return null;

  const activa = miCredencial?.estado === 'ACTIVA';

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
          <FotoPersona foto={usuario.foto} nombre={nombreCompleto(usuario)} size={56} rounded="rounded-2xl" />
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
            <Campo label="Contraseña actual" type="password" name="current-password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
            <Campo label="Contraseña nueva" type="password" name="new-password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
            <Campo label="Confirmar contraseña nueva" type="password" name="confirm-password" autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
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

        {/* 2) Estado de la credencial (solo informativo).
            El alumno NO puede revocar su propia credencial: cualquier trámite
            (pérdida, robo, reactivación) se hace en Servicios Escolares. */}
        <div className="mt-6 rounded-2xl border border-platino-light bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-marino">Mi credencial</h2>
            {miCredencial && (
              <Badge tono={miCredencial.estado === 'ACTIVA' ? 'verde' : miCredencial.estado === 'REVOCADA' ? 'rojo' : 'neutro'}>
                {miCredencial.estado}
              </Badge>
            )}
          </div>

          {activa ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Vigente hasta</span>
                <span className="font-bold text-marino">{formatVigencia(miCredencial.fecha_vencimiento)}</span>
              </div>
              <p className="pt-2 text-xs text-slate-500">
                Si la extravías o crees que alguien más la está usando, acude a <b>Servicios Escolares</b>
                para que la den de baja y te emitan una nueva.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-rojo">
              <p className="font-bold">Tu credencial no está activa</p>
              <p className="mt-1">
                No podrás ingresar al campus. Acude a <b>Servicios Escolares</b> para conocer el motivo
                y solicitar su reactivación.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
