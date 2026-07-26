'use client';

// ============================================================================
// FotoPersona — avatar con FOTO real de la persona.
// Usa el servicio pravatar.cc con una "semilla" (matrícula o nombre): la misma
// persona recibe SIEMPRE la misma foto. En producción la foto vendría del
// expediente del alumno; para la demo esto da rostros reales y consistentes.
// Si la imagen no carga (sin internet), cae al ícono de silueta de siempre.
//
// Props:
//   foto    -> imagen REAL subida al registrar (data URL); tiene prioridad
//   nombre  -> nombre de la persona (alt + semilla de respaldo)
//   semilla -> string estable que identifica a la persona (ej. matrícula)
//   size    -> lado en px (default 48)
//   rounded -> clase de borde (default 'rounded-xl'; usa 'rounded-full' si quieres círculo)
// ============================================================================
import { useState } from 'react';

export default function FotoPersona({ foto, nombre = '', semilla, size = 48, rounded = 'rounded-xl', className = '' }) {
  const [fallo, setFallo] = useState(false);
  const seed = encodeURIComponent(semilla || nombre || '');

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

  if (!fallo && seed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://i.pravatar.cc/${Math.max(96, size * 2)}?u=${seed}`}
        alt={nombre || 'Foto de la persona'}
        onError={() => setFallo(true)}
        className={`shrink-0 ${rounded} object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback: silueta genérica (mismo look que antes de tener fotos).
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${rounded} bg-platino-light text-slate-400 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg style={{ width: size * 0.55, height: size * 0.55 }} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </div>
  );
}
