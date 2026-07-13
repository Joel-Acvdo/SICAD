'use client';

// Panel de Servicios Escolares: gestión de usuarios (buscar, editar, renovar, revocar/reactivar).
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { cargarUsuarios, cambiarEstatusUsuario } from '@/store/userSlice';
import { cargarAccesosYCredenciales, cambiarEstadoCredencial, renovarVigencia } from '@/store/accessSlice';
import TopBar from '@/components/TopBar';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { formatVigencia, nombreCompleto } from '@/lib/format';

const IcoEditar = (p) => (<svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
const IcoRenovar = (p) => (<svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>);
const IcoX = (p) => (<svg {...p} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IcoCheck = (p) => (<svg {...p} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);
const IcoUser = (p) => (<svg {...p} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>);

export default function GestionUsuarios() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { usuario } = useSelector((s) => s.auth);
  const { lista, inicializado } = useSelector((s) => s.users);
  const { credenciales } = useSelector((s) => s.access);

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const [modal, setModal] = useState(null); // { tipo, usuario }
  const [renovarMeses, setRenovarMeses] = useState(12); // periodo elegido en el modal de renovar

  useEffect(() => {
    dispatch(cargarUsuarios());
    dispatch(cargarAccesosYCredenciales());
  }, [dispatch]);

  useEffect(() => {
    if (!usuario || usuario.tipo !== 'ADMINISTRATIVO') router.push('/login-admin');
  }, [usuario, router]);

  if (!usuario || !inicializado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gris-fondo">
        <p className="animate-pulse font-semibold text-marino">Cargando gestión de usuarios…</p>
      </div>
    );
  }

  const credDe = (id) => credenciales.find((c) => c.id_usuario === id);
  const vigenciaDe = (u) => {
    const c = credDe(u.id_usuario);
    if (u.estatus !== 'ACTIVO') return { txt: 'Revocada', rojo: true };
    return { txt: c ? formatVigencia(c.fecha_vencimiento) : '—', rojo: false };
  };

  const usuarios = lista.filter((u) => {
    const q = busqueda.toLowerCase();
    const coincide =
      nombreCompleto(u).toLowerCase().includes(q) ||
      u.matricula_empleado?.toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q);
    return coincide && (filtro === 'TODOS' || u.tipo === filtro);
  });

  // Acciones
  const revocar = (u) => {
    dispatch(cambiarEstatusUsuario({ id_usuario: u.id_usuario, estatus: 'SUSPENDIDO' }));
    dispatch(cambiarEstadoCredencial({ id_usuario: u.id_usuario, estado: 'REVOCADA' }));
    setModal(null);
  };
  const activar = (u) => {
    dispatch(cambiarEstatusUsuario({ id_usuario: u.id_usuario, estatus: 'ACTIVO' }));
    dispatch(cambiarEstadoCredencial({ id_usuario: u.id_usuario, estado: 'ACTIVA' }));
    setModal({ tipo: 'activado', usuario: u });
  };
  // Aplica la renovación: suma "meses" a la vigencia actual y actualiza la credencial.
  const renovar = (u, meses = 12) => {
    const c = credDe(u.id_usuario);
    const base = c ? new Date(c.fecha_vencimiento) : new Date();
    base.setMonth(base.getMonth() + meses);
    dispatch(renovarVigencia({ id_usuario: u.id_usuario, fecha_vencimiento: base.toISOString() }));
    setModal(null);
  };

  // Calcula (sin aplicar) cómo quedaría la nueva vigencia, para mostrarla en el modal.
  const nuevaVigencia = (u, meses = 12) => {
    const c = credDe(u.id_usuario);
    const base = c ? new Date(c.fecha_vencimiento) : new Date();
    base.setMonth(base.getMonth() + meses);
    return formatVigencia(base.toISOString());
  };

  return (
    <div className="flex min-h-screen flex-col bg-gris-fondo">
      <TopBar
        titulo="Servicios Escolares"
        subtitulo="Gestión de usuarios"
        onSalir={() => {
          dispatch(logout());
          router.push('/login-admin');
        }}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* Encabezado + acciones */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-marino">Gestión de Usuarios</h1>
            <p className="text-xs font-medium text-slate-500">Alta, edición, renovación y revocación de accesos.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/usuarios/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-marino px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-marino-light"
            >
              <span className="text-base leading-none">+</span> Registrar usuario
            </Link>
            <Link
              href="/admin/bitacora"
              className="inline-flex items-center gap-2 rounded-xl bg-platino-light px-4 py-2.5 text-xs font-bold text-marino transition hover:bg-platino"
            >
              Ver bitácora
            </Link>
          </div>
        </div>

        {/* Buscador y filtro */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-platino-light bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, matrícula o correo…"
            className="w-full rounded-xl border border-platino bg-platino-light/40 px-4 py-2.5 text-sm outline-none transition focus:border-azulmedio focus:bg-white md:max-w-md"
          />
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-xl border border-platino bg-platino-light/40 px-3 py-2.5 text-sm outline-none focus:border-azulmedio"
          >
            {['TODOS', 'ALUMNO', 'DOCENTE', 'TRABAJADOR', 'ADMINISTRATIVO', 'SEGURIDAD'].map((t) => (
              <option key={t} value={t}>{t === 'TODOS' ? 'Todos los tipos' : t}</option>
            ))}
          </select>
        </div>

        {/* Tabla (escritorio) */}
        <div className="hidden overflow-hidden rounded-2xl border border-platino-light bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-marino text-xs font-bold text-white">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Vigencia</th>
                <th className="px-5 py-3">Estatus</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const activo = u.estatus === 'ACTIVO';
                const vig = vigenciaDe(u);
                return (
                  <tr key={u.id_usuario} className="border-b border-platino-light last:border-0 hover:bg-platino-light/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-platino-light text-slate-400">
                          <IcoUser className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-marino">{nombreCompleto(u)}</p>
                          <p className="text-xs text-slate-400">{u.matricula_empleado}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{u.tipo}</td>
                    <td className={`px-5 py-3 font-semibold ${vig.rojo ? 'text-rojo' : 'text-slate-600'}`}>{vig.txt}</td>
                    <td className="px-5 py-3"><Badge tono={activo ? 'verde' : 'rojo'}>{activo ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <BotonIcono onClick={() => router.push(`/admin/usuarios/${u.id_usuario}`)} titulo="Editar" bg="bg-platino-light" color="text-slate-600"><IcoEditar className="h-4 w-4" /></BotonIcono>
                        <BotonIcono onClick={() => { setRenovarMeses(12); setModal({ tipo: 'renovar', usuario: u }); }} titulo="Renovar" bg="bg-blue-50" color="text-azulmedio"><IcoRenovar className="h-4 w-4" /></BotonIcono>
                        {activo ? (
                          <BotonIcono onClick={() => setModal({ tipo: 'revocar', usuario: u })} titulo="Revocar" bg="bg-red-50" color="text-rojo"><IcoX className="h-4 w-4" /></BotonIcono>
                        ) : (
                          <BotonIcono onClick={() => activar(u)} titulo="Reactivar" bg="bg-green-50" color="text-verde"><IcoCheck className="h-4 w-4" /></BotonIcono>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tarjetas (móvil) */}
        <div className="space-y-3 md:hidden">
          {usuarios.map((u) => {
            const activo = u.estatus === 'ACTIVO';
            const vig = vigenciaDe(u);
            return (
              <div key={u.id_usuario} className="rounded-2xl border border-platino-light bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-platino-light text-slate-400"><IcoUser className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-marino">{nombreCompleto(u)}</p>
                    <p className="text-xs text-slate-400">{u.matricula_empleado} · {u.tipo}</p>
                  </div>
                  <Badge tono={activo ? 'verde' : 'rojo'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <p className={`mt-2 text-xs font-semibold ${vig.rojo ? 'text-rojo' : 'text-slate-500'}`}>Vigencia: {vig.txt}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <BtnMovil onClick={() => router.push(`/admin/usuarios/${u.id_usuario}`)} bg="bg-platino-light" color="text-marino"><IcoEditar className="h-4 w-4" /> Editar</BtnMovil>
                  <BtnMovil onClick={() => { setRenovarMeses(12); setModal({ tipo: 'renovar', usuario: u }); }} bg="bg-blue-50" color="text-azulmedio"><IcoRenovar className="h-4 w-4" /> Renovar</BtnMovil>
                  {activo ? (
                    <BtnMovil onClick={() => setModal({ tipo: 'revocar', usuario: u })} bg="bg-red-50" color="text-rojo"><IcoX className="h-4 w-4" /> Revocar</BtnMovil>
                  ) : (
                    <BtnMovil onClick={() => activar(u)} bg="bg-green-50" color="text-verde"><IcoCheck className="h-4 w-4" /> Activar</BtnMovil>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {usuarios.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No se encontraron usuarios.</p>}

        <p className="mt-4 text-xs text-slate-400">
          Al revocar el acceso, la credencial NFC del usuario queda inhabilitada de inmediato (revocación automática de privilegios).
        </p>
      </main>

      {/* Modal: renovar vigencia (muestra vigencia actual -> nueva) */}
      {modal?.tipo === 'renovar' && (
        <Modal onClose={() => setModal(null)}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-azulmedio">
              <IcoRenovar className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-marino">Renovar vigencia</h3>
            <p className="mt-1 text-sm text-slate-500">{nombreCompleto(modal.usuario)} · {modal.usuario.matricula_empleado}</p>

            {/* Comparación: lo que tiene hoy vs cómo quedaría */}
            <div className="mt-5 flex w-full items-center gap-3">
              <div className="flex-1 rounded-xl bg-platino-light p-3 text-center">
                <p className="text-[11px] font-semibold text-slate-500">Vigencia actual</p>
                <p className="text-base font-black text-marino">{vigenciaDe(modal.usuario).txt}</p>
              </div>
              <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <div className="flex-1 rounded-xl bg-green-100 p-3 text-center">
                <p className="text-[11px] font-semibold text-verde">Nueva vigencia</p>
                <p className="text-base font-black text-verde">{nuevaVigencia(modal.usuario, renovarMeses)}</p>
              </div>
            </div>

            {/* Selector de periodo */}
            <div className="mt-4 w-full">
              <p className="mb-1.5 text-left text-xs font-bold text-marino">Periodo de renovación</p>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-platino-light p-1">
                {[{ m: 12, t: '+ 1 año' }, { m: 6, t: '+ 6 meses' }].map((o) => (
                  <button key={o.m} onClick={() => setRenovarMeses(o.m)} className={`rounded-lg py-2 text-xs font-bold transition ${renovarMeses === o.m ? 'bg-marino text-white shadow' : 'text-marino hover:bg-white'}`}>
                    {o.t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex w-full gap-3">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-platino bg-white py-3 text-sm font-bold text-marino hover:bg-platino-light">Cancelar</button>
              <button onClick={() => renovar(modal.usuario, renovarMeses)} className="flex-1 rounded-xl bg-azulmedio py-3 text-sm font-bold text-white hover:bg-marino">Renovar credencial</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: confirmar revocación */}
      {modal?.tipo === 'revocar' && (
        <Modal onClose={() => setModal(null)}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-rojo">
              <IcoX className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-marino">¿Revocar acceso?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Vas a marcar como inactivo a <b>{nombreCompleto(modal.usuario)}</b> ({modal.usuario.matricula_empleado}).
              Su credencial NFC quedará inhabilitada de inmediato y no podrá ingresar.
            </p>
            <div className="mt-6 flex w-full gap-3">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-platino bg-white py-3 text-sm font-bold text-marino hover:bg-platino-light">Cancelar</button>
              <button onClick={() => revocar(modal.usuario)} className="flex-1 rounded-xl bg-rojo py-3 text-sm font-bold text-white hover:opacity-90">Sí, revocar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: usuario activado (muestra hasta cuándo) */}
      {modal?.tipo === 'activado' && (
        <Modal onClose={() => setModal(null)}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-verde">
              <IcoCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-marino">Usuario activado</h3>
            <p className="mt-2 text-sm text-slate-500">
              <b>{nombreCompleto(modal.usuario)}</b> vuelve a tener acceso al campus y su credencial NFC ya funciona.
            </p>
            <div className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-green-100 p-4">
              <svg className="h-6 w-6 text-verde" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <div className="text-left">
                <p className="text-xs font-bold text-verde">Acceso activo hasta</p>
                <p className="text-lg font-black text-verde">{vigenciaDe(modal.usuario).txt}</p>
              </div>
            </div>
            <button onClick={() => setModal(null)} className="mt-6 w-full rounded-xl bg-marino py-3 font-bold text-white">Entendido</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BotonIcono({ children, onClick, titulo, bg, color }) {
  return (
    <button onClick={onClick} title={titulo} className={`rounded-lg ${bg} ${color} p-2 transition hover:opacity-80`}>
      {children}
    </button>
  );
}
function BtnMovil({ children, onClick, bg, color }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-1 rounded-lg ${bg} ${color} py-2 text-[11px] font-bold transition hover:opacity-80`}>
      {children}
    </button>
  );
}
