'use client';

// Edición de un usuario existente (Servicios Escolares).
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { cargarUsuarios, actualizarUsuario } from '@/store/userSlice';
import { cargarAccesosYCredenciales } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import Campo from '@/components/Campo';
import Badge from '@/components/Badge';
import { formatVigencia } from '@/lib/format';

const tipos = ['ALUMNO', 'DOCENTE', 'ADMINISTRATIVO'];

export default function EditarUsuario() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista, inicializado } = useSelector((s) => s.users);
  const { credenciales } = useSelector((s) => s.access);

  const id = Number(params.id);
  const [f, setF] = useState(null);

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);
  useEffect(() => {
    if (usuario && usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
  }, [usuario, router]);

  // Cuando cargan los usuarios, precarga el formulario con los datos del usuario.
  useEffect(() => {
    if (inicializado && !f) {
      const u = lista.find((x) => x.id_usuario === id);
      if (u) setF({ ...u });
    }
  }, [inicializado, lista, id, f]);

  if (!f) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gris-fondo">
        <p className="animate-pulse font-semibold text-marino">Cargando usuario…</p>
      </div>
    );
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const cred = credenciales.find((c) => c.id_usuario === id);
  const activo = f.estatus === 'ACTIVO';

  const guardar = (e) => {
    e.preventDefault();
    dispatch(actualizarUsuario({
      id_usuario: id,
      nombre: f.nombre,
      apellidos: f.apellidos,
      correo: f.correo,
      matricula_empleado: f.matricula_empleado,
      carrera: f.carrera,
      tipo: f.tipo,
    }));
    router.push('/admin/usuarios');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Servicios Escolares" subtitulo="Editar usuario" onVolver={() => router.push('/admin/usuarios')} onSalir={() => router.push('/admin/usuarios')} />

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-start gap-8 px-4 py-8 md:grid-cols-3">
        <form onSubmit={guardar} className="rounded-2xl border border-platino-light bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-marino">Editar usuario</h1>
              <p className="text-sm text-slate-500">La credencial NFC conserva su código.</p>
            </div>
            <Badge tono={activo ? 'verde' : 'rojo'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
          </div>

          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-bold text-marino">Tipo de usuario</span>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-platino-light p-1">
              {tipos.map((t) => (
                <button key={t} type="button" onClick={() => setF({ ...f, tipo: t })}
                  className={`rounded-lg py-2 text-xs font-bold transition ${f.tipo === t ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'}`}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre(s)" value={f.nombre} onChange={set('nombre')} required />
            <Campo label="Apellidos" value={f.apellidos} onChange={set('apellidos')} required />
            <Campo label="Correo institucional" type="email" value={f.correo} onChange={set('correo')} required />
            <Campo label="Matrícula / No. de empleado" value={f.matricula_empleado || ''} onChange={set('matricula_empleado')} />
            <Campo className="sm:col-span-2" label="Carrera o área" value={f.carrera || ''} onChange={set('carrera')} />
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="rounded-xl bg-azulmedio px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-marino">Guardar cambios</button>
            <button type="button" onClick={() => router.push('/admin/usuarios')} className="rounded-xl border border-platino bg-white px-6 py-3 text-sm font-bold text-marino hover:bg-platino-light">Cancelar</button>
          </div>
        </form>

        {/* Credencial del usuario */}
        <div>
          <p className="mb-2 text-sm font-black text-marino">Credencial del usuario</p>
          <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-marino-dark to-marino-light p-5 text-white shadow-xl">
            <div>
              <p className="text-base font-black tracking-wide">SICAD</p>
              <p className="text-[8px] font-bold tracking-widest text-platino">CREDENCIAL DIGITAL · UPA</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <svg className="h-6 w-6 text-platino" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{f.nombre} {f.apellidos}</p>
                <p className="text-[10px] text-platino">Matrícula: {f.matricula_empleado || 'S/N'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-[9px] font-black ${cred?.estado === 'ACTIVA' ? 'bg-verde' : 'bg-rojo'}`}>{cred?.estado || 'SIN CREDENCIAL'}</span>
              {cred && <span className="text-[10px] text-platino">Vence {formatVigencia(cred.fecha_vencimiento)}</span>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
