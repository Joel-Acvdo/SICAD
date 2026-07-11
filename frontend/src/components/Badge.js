// ============================================================================
// Badge — Píldora de ESTADO reutilizable (Activo, Inactivo, Permitido,
// Denegado, Vigente…). Centraliza los colores para que sean consistentes.
//
// Props:
//   children -> el texto del badge
//   tono     -> 'verde' (ok/activo) | 'rojo' (error/inactivo) | 'neutro'
// ============================================================================
export default function Badge({ children, tono = 'neutro' }) {
  // Mapa de tono -> clases de color (fondo claro + texto del color).
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
