// Campo de formulario etiquetado. Soporta input normal o (con `opciones`) un select.
export default function Campo({ label, opciones, className = '', ...props }) {
  const base =
    'w-full rounded-xl border border-platino bg-platino-light/40 px-4 py-2.5 text-sm outline-none transition focus:border-azulmedio focus:bg-white focus:ring-2 focus:ring-azulmedio/20';
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-marino">{label}</span>
      {opciones ? (
        <select className={base} {...props}>
          {opciones.map((o) => (
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
