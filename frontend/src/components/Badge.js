// Píldora de estado (Activo, Permitido, Denegado, Vigente, etc.).
export default function Badge({ children, tono = 'neutro' }) {
  const estilos = {
    verde: 'bg-green-100 text-verde',
    rojo: 'bg-red-100 text-rojo',
    neutro: 'bg-platino-light text-marino',
  }[tono];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${estilos}`}>
      {children}
    </span>
  );
}
