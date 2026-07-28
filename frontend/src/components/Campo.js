// ============================================================================
// Campo — Input de formulario ETIQUETADO y reutilizable (login, alta, edición…).
//
// Props:
//   label     -> texto de la etiqueta arriba del campo
//   error     -> mensaje de error; pinta el borde en rojo y lo muestra debajo
//   opciones  -> si se pasa, en vez de <input> renderiza un <select> con esas opciones
//   className -> clases extra (ej. "sm:col-span-2" para ocupar 2 columnas)
//   ...props  -> el resto (value, onChange, type, placeholder, required…) pasa
//                directo al input/select nativo.
// ============================================================================
export default function Campo({ label, error, opciones, className = '', ...props }) {
  // Estilo compartido por input y select (borde platino, foco azul medio).
  // Con error: borde y fondo rojos para que salte a la vista cuál falló.
  const base = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
    error
      ? 'border-rojo bg-red-50 focus:border-rojo focus:ring-rojo/20'
      : 'border-platino bg-platino-light/40 focus:border-azulmedio focus:bg-white focus:ring-azulmedio/20'
  }`;
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-marino">{label}</span>
      {opciones ? (
        <select className={base} aria-invalid={!!error} {...props}>
          {opciones.map((o) => (
            // Cada opción admite {value,label} o un string simple.
            <option key={o.value ?? o} value={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      ) : (
        <input className={base} aria-invalid={!!error} {...props} />
      )}
      {error && (
        <span className="mt-1 flex items-start gap-1 text-xs font-medium text-rojo">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </span>
      )}
    </label>
  );
}
