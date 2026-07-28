'use client';

// ============================================================================
// FotoPersona — avatar de una persona.
//   1º) Si tiene FOTO real (subida al registrar), se muestra esa.
//   2º) Si no, se dibuja un avatar LOCAL con sus iniciales y un color estable
//       derivado del nombre (la misma persona siempre se ve igual).
//
// Se genera en el propio dispositivo: no depende de ningún servicio externo,
// funciona sin internet y no manda datos del usuario a terceros (OBS-02).
//
// Props:
//   foto    -> imagen real subida al registrar (data URL); tiene prioridad
//   nombre  -> nombre de la persona (para las iniciales y el alt)
//   size    -> lado en px (default 48)
//   rounded -> clase de borde (default 'rounded-xl'; usa 'rounded-full' si quieres círculo)
// ============================================================================

// Paleta de la marca para los avatares de iniciales.
const COLORES = ['#14274E', '#3F72BF', '#24407A', '#16A34A', '#D97706', '#7C3AED', '#0E7490'];

// Iniciales: primera letra del nombre y del primer apellido (máx. 2).
function iniciales(nombre = '') {
  const palabras = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return '?';
  if (palabras.length === 1) return palabras[0].charAt(0).toUpperCase();
  return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
}

// Color estable: misma persona → mismo color (suma simple de los caracteres).
function colorDe(texto = '') {
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma += texto.charCodeAt(i);
  return COLORES[suma % COLORES.length];
}

export default function FotoPersona({ foto, nombre = '', size = 48, rounded = 'rounded-xl', className = '' }) {
  // 1º) La foto subida en el registro (si existe) gana siempre.
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={foto}
        alt={nombre || 'Foto de la persona'}
        className={`shrink-0 ${rounded} object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // 2º) Avatar de iniciales dibujado localmente.
  return (
    <div
      role="img"
      aria-label={nombre || 'Sin foto'}
      title={nombre}
      className={`flex shrink-0 select-none items-center justify-center ${rounded} font-black text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: colorDe(nombre), fontSize: Math.round(size * 0.38) }}
    >
      {iniciales(nombre)}
    </div>
  );
}
