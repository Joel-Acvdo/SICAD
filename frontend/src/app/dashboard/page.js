'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/authSlice';
import api from '@/lib/api';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { token } = useSelector((s) => s.auth);
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Protección de ruta: sin token, al login.
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .get('/auth/perfil')
      .then(({ data }) => setPerfil(data.usuario))
      .catch(() => setError('No se pudo cargar el perfil. Inicia sesión de nuevo.'));
  }, [token, router]);

  const onLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const modulos = [
    { nombre: 'Usuarios', desc: 'Alta, baja y edición · revocación de privilegios' },
    { nombre: 'Credenciales NFC', desc: 'Emisión y validación de credenciales' },
    { nombre: 'Control de acceso', desc: 'Validación y registro de eventos' },
    { nombre: 'Portal de caseta', desc: 'Registro de visitantes y proveedores' },
    { nombre: 'Bitácora', desc: 'Historial de accesos y reportes' },
    { nombre: 'Puntos de acceso', desc: 'Gestión de accesos del campus' },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-sicad-900 px-6 py-4 text-white">
        <div>
          <h1 className="text-lg font-bold">SICAD</h1>
          <p className="text-xs text-sicad-100">Panel administrativo</p>
        </div>
        <div className="flex items-center gap-4">
          {perfil && (
            <span className="text-sm">
              {perfil.nombre} {perfil.apellidos} · <strong>{perfil.rol?.nombre}</strong>
            </span>
          )}
          <button
            onClick={onLogout}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            Salir
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl p-6">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <h2 className="mb-1 text-xl font-semibold text-slate-800">Módulos del sistema</h2>
        <p className="mb-6 text-sm text-slate-500">
          Estructura lista. Cada módulo se irá conectando a su API.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map((m) => (
            <div
              key={m.nombre}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="font-semibold text-sicad-900">{m.nombre}</h3>
              <p className="mt-1 text-sm text-slate-500">{m.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Por desarrollar
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
