'use client';

// Edición de un usuario existente (Servicios Escolares).
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { cargarUsuarios, actualizarUsuario } from '@/store/userSlice';
import { cargarAccesosYCredenciales, renovarVigencia, reemitirCredencial } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import Campo from '@/components/Campo';
import Badge from '@/components/Badge';
import SelectorCarrera from '@/components/SelectorCarrera';
import { comprimirImagen } from '@/lib/imagen';
import { formatVigencia } from '@/lib/format';

const tipos = ['ALUMNO', 'DOCENTE', 'ADMINISTRATIVO', 'SEGURIDAD'];
// Etiqueta visible de cada tipo (SEGURIDAD se muestra como "Caseta").
const etiquetaTipo = (t) => (t === 'SEGURIDAD' ? 'Caseta' : t.charAt(0) + t.slice(1).toLowerCase());

export default function EditarUsuario() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista, inicializado } = useSelector((s) => s.users);
  const { credenciales } = useSelector((s) => s.access);

  const id = Number(params.id);
  const [f, setF] = useState(null);
  const [password, setPassword] = useState(''); // vacío = no cambiar
  const [nuevaFecha, setNuevaFecha] = useState(''); // fecha exacta de vencimiento
  const [avisoVig, setAvisoVig] = useState('');
  const [confirmReem, setConfirmReem] = useState(false); // MEJ-05: confirmar reemisión
  const [reemitiendo, setReemitiendo] = useState(false);
  const [avisoReem, setAvisoReem] = useState('');
  const [errorGuardar, setErrorGuardar] = useState(''); // error del backend al guardar
  // Foto: undefined = sin cambios; data URL = nueva; '' = quitarla.
  const [fotoNueva, setFotoNueva] = useState(undefined);

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);
  useEffect(() => {
    if (!usuario || usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
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

  // Espera la respuesta del backend: si la validación falla (p. ej. contraseña
  // débil), muestra el motivo y NO navega — antes se "confirmaba" sin guardar.
  const guardar = async (e) => {
    e.preventDefault();
    setErrorGuardar('');
    const campos = {
      id_usuario: id,
      nombre: f.nombre,
      apellidos: f.apellidos,
      correo: f.correo,
      matricula_empleado: f.matricula_empleado,
      carrera: f.carrera,
      tipo: f.tipo,
    };
    if (password) campos.password = password; // solo si escribieron una nueva
    if (fotoNueva !== undefined) campos.foto = fotoNueva; // solo si la tocaron
    try {
      await dispatch(actualizarUsuario(campos)).unwrap();
      router.push('/admin/usuarios');
    } catch (err) {
      setErrorGuardar(typeof err === 'string' ? err : 'No se pudieron guardar los cambios.');
    }
  };

  // Edición de vigencia de la tarjeta (no navega; actualiza la credencial en vivo).
  const aplicarVigencia = (payload, texto) => {
    dispatch(renovarVigencia({ id_usuario: id, ...payload }));
    setAvisoVig(texto);
    setTimeout(() => setAvisoVig(''), 2500);
  };

  // MEJ-05: reemite la credencial (nuevo QR, vuelve a ACTIVA, el código anterior muere).
  const reemitir = async () => {
    setConfirmReem(false);
    setReemitiendo(true);
    try {
      await dispatch(reemitirCredencial(id)).unwrap();
      setAvisoReem('Credencial reemitida: se generó un QR nuevo y el anterior quedó inservible.');
      setTimeout(() => setAvisoReem(''), 4000);
    } catch (err) {
      setAvisoReem(typeof err === 'string' ? err : 'No se pudo reemitir la credencial.');
    } finally {
      setReemitiendo(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar titulo="Servicios Escolares" subtitulo="Editar usuario" onVolver={() => router.push('/admin/usuarios')} onSalir={() => router.push('/admin/usuarios')} />

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-start gap-8 px-4 py-8 md:grid-cols-3">
        <form onSubmit={guardar} className="rounded-2xl border border-platino-light bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-marino">Editar usuario</h1>
              <p className="text-sm text-slate-500">La credencial conserva su código.</p>
            </div>
            <Badge tono={activo ? 'verde' : 'rojo'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
          </div>

          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-bold text-marino">Tipo de usuario</span>
            <div className="grid grid-cols-4 gap-2 rounded-xl bg-platino-light p-1">
              {tipos.map((t) => (
                <button key={t} type="button" onClick={() => setF({ ...f, tipo: t })}
                  className={`rounded-lg py-2 text-xs font-bold transition ${f.tipo === t ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'}`}>
                  {etiquetaTipo(t)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre(s)" value={f.nombre} onChange={set('nombre')} required />
            <Campo label="Apellidos" value={f.apellidos} onChange={set('apellidos')} required />
            <Campo label="Correo institucional" type="email" value={f.correo} onChange={set('correo')} required />
            <Campo label="Matrícula / No. de empleado" value={f.matricula_empleado || ''} onChange={set('matricula_empleado')} />
            <SelectorCarrera
              className="sm:col-span-2"
              value={f.carrera || ''}
              onChange={(carrera) => setF({ ...f, carrera })}
              existentes={lista.map((u) => u.carrera)}
            />
            <Campo className="sm:col-span-2" label="Nueva contraseña (opcional)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Déjala vacía para no cambiarla" />

            {/* Foto del usuario (cambiar o quitar) */}
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-marino">Foto</span>
              <div className="flex items-center gap-4">
                {(fotoNueva !== undefined ? fotoNueva : f.foto) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoNueva !== undefined ? fotoNueva : f.foto} alt="Foto del usuario" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-platino-light text-slate-400">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="cursor-pointer rounded-xl border border-platino bg-white px-4 py-2 text-center text-xs font-bold text-marino transition hover:bg-platino-light">
                    {(fotoNueva !== undefined ? fotoNueva : f.foto) ? 'Cambiar foto' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try { setFotoNueva(await comprimirImagen(file)); } catch {}
                      }}
                      className="hidden"
                    />
                  </label>
                  {(fotoNueva !== undefined ? fotoNueva : f.foto) && (
                    <button type="button" onClick={() => setFotoNueva('')} className="text-xs font-semibold text-slate-400 hover:text-rojo">
                      Quitar
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400">Se guarda al pulsar Guardar cambios.</p>
                </div>
              </div>
            </div>
          </div>

          {errorGuardar && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-rojo">{errorGuardar}</p>
          )}

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

          {/* Edición de la vigencia de la tarjeta (Servicios Escolares) */}
          {cred && (
            <div className="mt-4 rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-marino">Vigencia de la tarjeta</p>
              <p className="mb-3 text-xs text-slate-500">Vence el <span className="font-bold text-marino">{formatVigencia(cred.fecha_vencimiento)}</span></p>

              <div className="mb-3 flex gap-2">
                <button type="button" onClick={() => aplicarVigencia({ meses: 6 }, 'Vigencia renovada +6 meses.')} className="flex-1 rounded-xl bg-platino-light py-2 text-xs font-bold text-marino transition hover:bg-platino">+6 meses</button>
                <button type="button" onClick={() => aplicarVigencia({ meses: 12 }, 'Vigencia renovada +12 meses.')} className="flex-1 rounded-xl bg-platino-light py-2 text-xs font-bold text-marino transition hover:bg-platino">+12 meses</button>
              </div>

              <label className="mb-1 block text-xs font-bold text-marino">O fija una fecha exacta</label>
              <div className="flex gap-2">
                <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} className="flex-1 rounded-xl border border-platino bg-white px-3 py-2 text-sm outline-none transition focus:border-azulmedio" />
                <button type="button" disabled={!nuevaFecha} onClick={() => { aplicarVigencia({ fecha_vencimiento: nuevaFecha }, 'Vigencia actualizada.'); setNuevaFecha(''); }} className="rounded-xl bg-azulmedio px-4 py-2 text-xs font-bold text-white transition hover:bg-marino disabled:opacity-50">Aplicar</button>
              </div>

              {avisoVig && <p className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-xs font-bold text-verde">{avisoVig}</p>}
            </div>
          )}

          {/* MEJ-05: reemitir credencial (devolver el acceso tras una pérdida) */}
          {cred && (
            <div className="mt-4 rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-marino">Reemitir credencial</p>
              <p className="mb-3 text-xs text-slate-500">
                Genera un <b>código QR nuevo</b> y reactiva la credencial. El código anterior queda
                inservible para siempre (útil cuando el alumno reportó su credencial como perdida).
              </p>

              {!confirmReem ? (
                <button
                  type="button"
                  onClick={() => setConfirmReem(true)}
                  disabled={reemitiendo}
                  className="w-full rounded-xl bg-marino py-2.5 text-xs font-bold text-white transition hover:bg-marino-dark disabled:opacity-60"
                >
                  {reemitiendo ? 'Reemitiendo…' : 'Reemitir credencial'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={reemitir} className="flex-1 rounded-xl bg-rojo py-2.5 text-xs font-bold text-white transition hover:opacity-90">Sí, reemitir</button>
                  <button type="button" onClick={() => setConfirmReem(false)} className="flex-1 rounded-xl border border-platino bg-white py-2.5 text-xs font-bold text-marino hover:bg-platino-light">Cancelar</button>
                </div>
              )}

              {avisoReem && <p className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-xs font-bold text-verde">{avisoReem}</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
