'use client';

// ============================================================================
// TopBar — Barra superior azul marino REUTILIZABLE (se usa en casi todas las
// pantallas de administración/caseta para no repetir el header en cada página).
//
// Props (todas opcionales):
//   titulo    -> texto principal (ej. "Servicios Escolares")
//   subtitulo -> texto pequeño debajo (ej. "Gestión de usuarios")
//   onVolver  -> función; si se pasa, muestra la flecha "Volver" a la izquierda
//   onSalir   -> función; si se pasa, muestra el botón "Salir" a la derecha
//   derecha   -> contenido personalizado a la derecha (reemplaza a "Salir")
//   dark      -> usa el fondo marino más oscuro
// ============================================================================
import { LogoInsignia } from './Logo';

export default function TopBar({ titulo, subtitulo, onVolver, onSalir, derecha, dark }) {
  return (
    <header className={`${dark ? 'bg-marino-dark' : 'bg-marino'} px-3 py-3 text-white shadow-md sm:px-4`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-3">
        {/* Lado izquierdo: (volver) + logo SICAD + título/subtítulo.
            min-w-0 + truncate permiten que el título se recorte antes de
            empujar los botones de la derecha fuera de la pantalla. */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onVolver && (
            <button onClick={onVolver} aria-label="Volver" className="shrink-0 rounded-lg bg-white/10 p-2 transition hover:bg-white/20">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Logo de la app (insignia QR) + nombre SICAD al lado */}
          <div className="shrink-0"><LogoInsignia size={32} fondo="#3F72BF" /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-wide sm:text-base">
              SICAD{titulo && titulo !== 'SICAD' && <span className="font-semibold text-platino"> · {titulo}</span>}
            </p>
            {subtitulo && <p className="truncate text-[11px] text-platino">{subtitulo}</p>}
          </div>
        </div>
        {/* Lado derecho: nunca se encoge ni se sale de la pantalla */}
        <div className="flex shrink-0 items-center gap-2">
          {derecha
            ? derecha
            : onSalir && (
                <button onClick={onSalir} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white hover:text-marino">
                  Salir
                </button>
              )}
        </div>
      </div>
    </header>
  );
}
