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
export default function TopBar({ titulo, subtitulo, onVolver, onSalir, derecha, dark }) {
  return (
    <header className={`${dark ? 'bg-marino-dark' : 'bg-marino'} px-4 py-3 text-white shadow-md`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        {/* Lado izquierdo: (volver) + logo QR + título/subtítulo */}
        <div className="flex min-w-0 items-center gap-3">
          {onVolver && (
            <button onClick={onVolver} aria-label="Volver" className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-azulmedio text-[10px] font-black text-white">QR</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-wide sm:text-base">{titulo}</p>
            {subtitulo && <p className="truncate text-[11px] text-platino">{subtitulo}</p>}
          </div>
        </div>
        {/* Lado derecho: contenido personalizado, o el botón Salir */}
        {derecha
          ? derecha
          : onSalir && (
              <button onClick={onSalir} className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white hover:text-marino">
                Salir
              </button>
            )}
      </div>
    </header>
  );
}
