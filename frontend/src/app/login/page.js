'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { login } from '@/store/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { cargando, error, token } = useSelector((s) => s.auth);

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  // Si ya hay token, ir al dashboard.
  useEffect(() => {
    if (token) router.push('/dashboard');
  }, [token, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login({ correo, password }));
    if (login.fulfilled.match(res)) router.push('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sicad-900 to-sicad-700 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-sicad-900">SICAD</h1>
          <p className="text-sm text-slate-500">Sistema de Control de Acceso Digital</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              placeholder="admin@upa.edu.mx"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-sicad-700 focus:outline-none focus:ring-1 focus:ring-sicad-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-sicad-700 focus:outline-none focus:ring-1 focus:ring-sicad-700"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-sicad-700 py-2.5 font-medium text-white transition hover:bg-sicad-800 disabled:opacity-60"
          >
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo: admin@upa.edu.mx / Admin123!
        </p>
      </div>
    </main>
  );
}
