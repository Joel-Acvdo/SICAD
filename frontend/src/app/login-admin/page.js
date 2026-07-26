'use client';

// Login del personal administrativo (Caseta / Servicios Escolares).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { login, limpiarError } from '@/store/authSlice';
import Logo from '@/components/Logo';
import Campo from '@/components/Campo';
import DemoAcceso from '@/components/DemoAcceso';

const areas = [
  { id: 'caseta', nombre: 'Personal de Caseta', demo: 'caseta@upa.edu.mx', pass: 'Caseta123!' },
  { id: 'escolares', nombre: 'Servicios Escolares', demo: 'admin@upa.edu.mx', pass: 'Admin123!' },
];

export default function LoginAdmin() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { usuario, error, cargando } = useSelector((s) => s.auth);

  const [area, setArea] = useState('escolares');
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(limpiarError());
  }, [dispatch]);

  useEffect(() => {
    if (!usuario) return;
    if (usuario.tipo === 'SEGURIDAD') router.push('/caseta/validar');
    else if (usuario.tipo === 'ADMINISTRATIVO') router.push('/admin/dashboard');
    else router.push('/credencial');
  }, [usuario, router]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ identificador, password }));
  };

  const areaActual = areas.find((a) => a.id === area);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marino-dark to-marino p-4">
      <div className="w-full max-w-md animate-fade-in rounded-3xl bg-white p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-6 text-center text-xl font-black text-marino">Panel Administrativo</h1>
        <p className="mb-5 text-center text-sm text-slate-500">Selecciona tu área</p>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-platino-light p-1">
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setArea(a.id)}
              className={`rounded-lg py-2 text-sm font-bold transition ${
                area === a.id ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'
              }`}
            >
              {a.nombre}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Campo
            label="Usuario o correo"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder={areaActual.demo}
            required
          />
          <Campo
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-rojo">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-azulmedio py-3 font-bold text-white shadow transition hover:bg-marino active:scale-95 disabled:opacity-60"
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-azulmedio hover:underline">
          Soy alumno o personal
        </Link>

        <DemoAcceso usuario={areaActual.demo} password={areaActual.pass} />
      </div>
    </main>
  );
}
