// ============================================================================
// Logo — Insignia institucional SICAD dibujada como GRÁFICO VECTORIAL (SVG).
// Es una tarjeta redondeada azul marino con un código QR estilizado (los tres
// cuadros marcadores + módulos de datos). Al ser vectorial escala sin pixelarse.
// Se usa en los logins y pantallas de bienvenida.
//
// Props:
//   conTexto -> si es true, muestra el wordmark "SICAD" y el subtítulo
//   size     -> tamaño de la insignia en px (ancho/alto)
// ============================================================================
export default function Logo({ conTexto = true, size = 56 }) {
  // Un "cuadro marcador" de QR: anillo exterior blanco + hueco marino + punto blanco.
  const Marcador = ({ x, y }) => (
    <g>
      <rect x={x} y={y} width="26" height="26" rx="6" fill="#FFFFFF" />
      <rect x={x + 5} y={y + 5} width="16" height="16" rx="3" fill="#14274E" />
      <rect x={x + 9} y={y + 9} width="8" height="8" rx="1.5" fill="#FFFFFF" />
    </g>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Insignia con QR estilizado (todo vectorial, colores de marca) */}
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="SICAD">
        {/* Tarjeta redondeada de fondo */}
        <rect x="0" y="0" width="100" height="100" rx="24" fill="#14274E" />

        {/* Tres cuadros marcadores (esquinas del QR) */}
        <Marcador x="16" y="16" />
        <Marcador x="58" y="16" />
        <Marcador x="16" y="58" />

        {/* Módulos de datos (cuarto inferior derecho) */}
        <g fill="#FFFFFF">
          <rect x="58" y="58" width="8" height="8" rx="1.5" />
          <rect x="70" y="58" width="8" height="8" rx="1.5" />
          <rect x="58" y="70" width="8" height="8" rx="1.5" />
          <rect x="76" y="70" width="8" height="8" rx="1.5" />
          <rect x="70" y="76" width="6" height="6" rx="1.5" />
        </g>
      </svg>

      {conTexto && (
        <div className="text-center leading-tight">
          <p className="text-2xl font-black tracking-wide text-marino">SICAD</p>
          <p className="text-[11px] font-semibold text-azulmedio">Control de Acceso Digital</p>
        </div>
      )}
    </div>
  );
}
