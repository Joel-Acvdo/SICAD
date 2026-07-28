'use client'; // Página interactiva (usa hooks y estado) -> componente de cliente.

// ============================================================================
// /login — Inicio de sesión de la COMUNIDAD (alumnos y personal).
// ============================================================================

// --- De dónde viene cada import ---
import { useState, useEffect } from 'react'; // hooks de React (estado y efectos)
import { useRouter } from 'next/navigation'; // para redirigir entre páginas (Next.js)
import Link from 'next/link'; // enlaces internos sin recargar la página
import { useDispatch, useSelector } from 'react-redux'; // leer/escribir el estado global
import { login, limpiarError } from '@/store/authSlice'; // actions de la sesión (login real vía API)
import Logo from '@/components/Logo'; // logo SICAD reutilizable
import Campo from '@/components/Campo'; // input etiquetado reutilizable
import DemoAcceso from '@/components/DemoAcceso'; // credenciales demo con copiar

export default function LoginAlumnos() {
  const dispatch = useDispatch(); // dispatch(action) -> modifica el estado global
  const router = useRouter(); // router.push('/ruta') -> navega
  // useSelector lee de la rama "auth" del store: el usuario logueado y el error.
  const { usuario, error, cargando } = useSelector((s) => s.auth);

  // Estado LOCAL del formulario (solo vive en esta página).
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');

  // Efecto al montar: limpia errores viejos del login.
  useEffect(() => {
    dispatch(limpiarError());
  }, [dispatch]);

  // Efecto que reacciona cuando "usuario" cambia: si hay sesión, redirige según el rol.
  useEffect(() => {
    if (!usuario) return;
    if (usuario.tipo === 'SEGURIDAD') router.push('/caseta/validar');
    else if (usuario.tipo === 'ADMINISTRATIVO') router.push('/admin/dashboard');
    else router.push('/credencial'); // alumnos/personal -> su credencial
  }, [usuario, router]);

  // Al enviar el formulario, dispara la action de login con lo capturado.
  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ identificador, password }));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marino to-marino-light p-4">
      <div className="w-full max-w-md animate-fade-in rounded-3xl bg-white p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-6 text-center text-xl font-black text-marino">Comunidad UPA</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Alumnos y personal</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* OBS-01: name + autoComplete para el autocompletado y la accesibilidad */}
          <Campo label="Matrícula o correo" name="username" autoComplete="username" value={identificador} onChange={(e) => setIdentificador(e.target.value)} placeholder="UP230571 o joel.acevedo@upa.edu.mx" required />
          <Campo label="Contraseña" type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />

          {/* El error viene del estado global (authSlice) si el usuario no existe. */}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-rojo">{error}</p>}

          <button type="submit" disabled={cargando} className="w-full rounded-xl bg-azulmedio py-3 font-bold text-white shadow transition hover:bg-marino active:scale-95 disabled:opacity-60">
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <Link href="/login-admin" className="mt-6 block text-center text-sm font-semibold text-azulmedio hover:underline">
          ¿Eres administrativo? Entra aquí
        </Link>

        <DemoAcceso usuario="UP230571" password="Alumno123!" />
      </div>
    </main>
  );
}
