// ============================================================================
// Campo — Input de formulario ETIQUETADO y reutilizable (login, alta, edición…).
//
// Props:
//   label     -> texto de la etiqueta arriba del campo
//   opciones  -> si se pasa, en vez de <input> renderiza un <select> con esas opciones
//   className -> clases extra (ej. "sm:col-span-2" para ocupar 2 columnas)
//   ...props  -> el resto (value, onChange, type, placeholder, required…) pasa
//                directo al input/select nativo.
// ============================================================================
export default function Campo({ label, opciones, className = '', ...props }) {
  // Estilo compartido por input y select (borde platino, foco azul medio).
  const base =
    'w-full rounded-xl border border-platino bg-platino-light/40 px-4 py-2.5 text-sm outline-none transition focus:border-azulmedio focus:bg-white focus:ring-2 focus:ring-azulmedio/20';
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-marino">{label}</span>
      {opciones ? (
        <select className={base} {...props}>
          {opciones.map((o) => (
            // Cada opción admite {value,label} o un string simple.
            <option key={o.value ?? o} value={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      ) : (
        <input className={base} {...props} />
      )}
    </label>
  );
}
