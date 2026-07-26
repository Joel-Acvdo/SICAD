'use client';

// Alta de un nuevo usuario de la comunidad (emite su credencial digital al guardar).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { agregarUsuario } from '@/store/userSlice';
import TopBar from '@/components/TopBar';
import Campo from '@/components/Campo';

const tipos = ['ALUMNO', 'DOCENTE', 'ADMINISTRATIVO'];

export default function NuevoUsuario() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);

  const [f, setF] = useState({ nombre: '', apellidos: '', correo: '', matricula_empleado: '', carrera: '', tipo: 'ALUMNO', password: '' });
  const [guardando, setGuardando] = useState(false); // MEJ-06: petición en curso
  const [errorMsg, setErrorMsg] = useState(''); // MEJ-06: error del servidor o de validación

  useEffect(() => {
    if (usuario && usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
  }, [usuario, router]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!f.nombre || !f.apellidos || !f.correo) {
      setErrorMsg('Completa nombre, apellidos y correo.');
      return;
    }
    setGuardando(true);
    try {
      // Si dejan la contraseña vacía, se omite para que el backend asigne la temporal.
      const payload = { ...f };
      if (!payload.password) delete payload.password;
      // El backend crea el usuario Y emite su credencial automáticamente.
      await dispatch(agregarUsuario(payload)).unwrap();
      router.push('/admin/usuarios');
    } catch (err) {
      // MEJ-06: si falla (correo duplicado, contraseña débil…) muestra el error y no navega.
      setErrorMsg(typeof err === 'string' ? err : 'No se pudo registrar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Servicios Escolares" subtitulo="Registrar usuario" onVolver={() => router.push('/admin/usuarios')} onSalir={() => router.push('/admin/usuarios')} />

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-start gap-8 px-4 py-8 md:grid-cols-3">
        {/* Formulario */}
        <form onSubmit={guardar} className="rounded-2xl border border-platino-light bg-white p-6 shadow-sm md:col-span-2">
          <h1 className="text-xl font-black text-marino">Registrar alumno o personal</h1>
          <p className="mb-5 text-sm text-slate-500">Al guardar se emite automáticamente su credencial digital.</p>

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
            <Campo label="Nombre(s)" value={f.nombre} onChange={set('nombre')} placeholder="Ej. Joel Alberto" required />
            <Campo label="Apellidos" value={f.apellidos} onChange={set('apellidos')} placeholder="Ej. Acevedo Moreno" required />
            <Campo label="Correo institucional" type="email" value={f.correo} onChange={set('correo')} placeholder="usuario@upa.edu.mx" required />
            <Campo label="Matrícula / No. de empleado" value={f.matricula_empleado} onChange={set('matricula_empleado')} placeholder="UP230571" />
            <Campo className="sm:col-span-2" label="Carrera o área" value={f.carrera} onChange={set('carrera')} placeholder="Ing. en Sistemas Computacionales" />
            <Campo className="sm:col-span-2" label="Contraseña" type="password" value={f.password} onChange={set('password')} placeholder="Mín. 8 caracteres con letras y números · vacío = temporal" />
          </div>

          {/* MEJ-06: mensaje de error del servidor o de validación */}
          {errorMsg && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-rojo">{errorMsg}</p>}

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={guardando} className="rounded-xl bg-azulmedio px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-marino disabled:opacity-60">{guardando ? 'Guardando…' : 'Registrar usuario'}</button>
            <button type="button" onClick={() => router.push('/admin/usuarios')} className="rounded-xl border border-platino bg-white px-6 py-3 text-sm font-bold text-marino hover:bg-platino-light">Cancelar</button>
          </div>
        </form>

        {/* Vista previa de la credencial */}
        <div>
          <p className="mb-2 text-sm font-black text-marino">Credencial a emitir</p>
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
                <p className="truncate text-sm font-black">{f.nombre || 'Nombre'} {f.apellidos}</p>
                <p className="text-[10px] text-platino">Matrícula: {f.matricula_empleado || 'S/N'}</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-verde px-3 py-1 text-[9px] font-black">ACTIVA</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">La credencial digital se genera automáticamente al registrar al usuario.</p>
        </div>
      </main>
    </div>
  );
}
