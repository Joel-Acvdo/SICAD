'use client';

// Caseta: registra a un visitante o proveedor externo. El registro deja un
// acceso de ENTRADA en la bitácora (ya no genera un "pase temporal").
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { registrarVisitante, cargarAccesosYCredenciales } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import TabsCaseta from '@/components/TabsCaseta';
import Campo from '@/components/Campo';

export default function RegistrarExterno() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);

  const [f, setF] = useState({ nombre: '', identificacion: '', empresa: '', motivo: '', destino: '', tipo: 'VISITANTE' });
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false); // MEJ-06: petición en curso
  const [errorMsg, setErrorMsg] = useState(''); // MEJ-06: error del servidor o de validación

  useEffect(() => {
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario || (usuario.tipo !== 'SEGURIDAD' && usuario.tipo !== 'ADMINISTRATIVO')) router.push('/login-admin');
  }, [usuario, router]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // MEJ-06: espera la confirmación real del servidor con .unwrap() antes de dar por
  // registrado el acceso (antes decía "todo bien" aunque la petición hubiera fallado).
  const guardar = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!f.nombre || !f.identificacion) {
      setErrorMsg('Captura al menos el nombre y la identificación.');
      return;
    }
    setGuardando(true);
    try {
      // Registra al externo y deja su acceso de ENTRADA en la bitácora (lo hace el backend).
      await dispatch(
        registrarVisitante({
          nombre: f.nombre,
          identificacion: f.identificacion,
          empresa: f.empresa,
          motivo: f.motivo,
          destino: f.destino,
        })
      ).unwrap();
      setOk(true);
      setTimeout(() => router.push('/caseta/bitacora'), 1200);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : 'No se pudo registrar el acceso.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Caseta de Seguridad" subtitulo="Registro de externos" onSalir={() => { dispatch(logout()); router.push('/login-admin'); }} />
      <TabsCaseta />

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-start gap-8 px-4 py-8 md:grid-cols-3">
        <form onSubmit={guardar} className="rounded-2xl border border-platino-light bg-white p-6 shadow-sm md:col-span-2">
          <h1 className="text-xl font-black text-marino">Registrar visitante o proveedor</h1>
          <p className="mb-5 text-sm text-slate-500">Captura los datos del externo para registrar su acceso de entrada en la bitácora.</p>

          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-bold text-marino">Tipo de externo</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-platino-light p-1">
              {['VISITANTE', 'PROVEEDOR'].map((t) => (
                <button key={t} type="button" onClick={() => setF({ ...f, tipo: t })}
                  className={`rounded-lg py-2 text-xs font-bold transition ${f.tipo === t ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'}`}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre completo" value={f.nombre} onChange={set('nombre')} placeholder="Nombre del externo" required />
            <Campo label="Identificación" value={f.identificacion} onChange={set('identificacion')} placeholder="INE / credencial" required />
            <Campo label="Empresa o procedencia" value={f.empresa} onChange={set('empresa')} placeholder="Ej. Proveedora S.A." />
            <Campo label="Motivo de la visita" value={f.motivo} onChange={set('motivo')} placeholder="Ej. Entrega de material" />
            <Campo className="sm:col-span-2" label="Persona o área a visitar" value={f.destino} onChange={set('destino')} placeholder="Ej. Servicios Escolares" />
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={guardando} className="rounded-xl bg-azulmedio px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-marino disabled:opacity-60">{guardando ? 'Guardando…' : 'Registrar acceso'}</button>
            <button type="button" onClick={() => router.push('/caseta/validar')} className="rounded-xl border border-platino bg-white px-6 py-3 text-sm font-bold text-marino hover:bg-platino-light">Cancelar</button>
          </div>

          {/* MEJ-06: error real del servidor (ya no se muestra éxito si falló) */}
          {errorMsg && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-rojo">{errorMsg}</p>}
          {ok && <p className="mt-4 rounded-xl bg-green-100 px-4 py-3 text-sm font-bold text-verde">Acceso registrado en la bitácora. Redirigiendo…</p>}
        </form>

        {/* Vista previa del registro de acceso */}
        <div>
          <p className="mb-2 text-sm font-black text-marino">Vista previa del registro</p>
          <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-marino to-marino-light p-5 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black tracking-wide">REGISTRO DE ACCESO</p>
                <p className="text-[8px] font-bold tracking-widest text-platino">{f.tipo} · SICAD</p>
              </div>
              <span className="rounded-full bg-verde px-2.5 py-0.5 text-[9px] font-black">ENTRADA</span>
            </div>
            <p className="text-lg font-black">{f.nombre || 'Nombre del externo'}</p>
            <div className="space-y-1 text-xs">
              <Linea k="Motivo" v={f.motivo || '—'} />
              <Linea k="Destino" v={f.destino || '—'} />
              <Linea k="Identificación" v={f.identificacion || '—'} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Al registrar, queda un acceso de entrada del externo en la bitácora de accesos.</p>
        </div>
      </main>
    </div>
  );
}

function Linea({ k, v }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-platino">{k}</span>
      <span className="truncate font-bold">{v}</span>
    </div>
  );
}
