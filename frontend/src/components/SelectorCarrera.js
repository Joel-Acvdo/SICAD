'use client';

// ============================================================================
// SelectorCarrera — carrera/área del usuario como LISTA desplegable.
// Opciones = catálogo base de la UPA (lib/carreras.js) ∪ carreras que ya
// existen en los usuarios registrados (así, una carrera nueva agregada una vez
// aparece sola en los siguientes registros).
// La opción "➕ Agregar otra…" cambia a un campo de texto libre para capturar
// una carrera nueva sin salir del formulario.
//
// Props:
//   value      -> carrera actual (string)
//   onChange   -> (string) => void
//   existentes -> carreras ya usadas por otros usuarios (opcional)
//   className  -> clases extra del contenedor (ej. 'sm:col-span-2')
// ============================================================================
import { useState } from 'react';
import { CARRERAS_UPA } from '@/lib/carreras';

const OTRA = '__otra__';

export default function SelectorCarrera({ value = '', onChange, existentes = [], className = '' }) {
  // Catálogo + las ya registradas, sin duplicados y ordenadas.
  const opciones = Array.from(new Set([...CARRERAS_UPA, ...existentes.filter(Boolean)])).sort((a, b) =>
    a.localeCompare(b, 'es')
  );
  // Modo texto libre: activo si eligieron "otra", o si el valor actual no está en la lista.
  const [libre, setLibre] = useState(() => !!value && !opciones.includes(value));

  if (libre) {
    return (
      <label className={`block ${className}`}>
        <span className="mb-1.5 block text-xs font-bold text-marino">Carrera o área (nueva)</span>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe la carrera o área nueva"
            autoFocus
            className="w-full rounded-xl border border-platino bg-white px-3 py-2.5 text-sm outline-none transition focus:border-azulmedio"
          />
          <button
            type="button"
            onClick={() => { setLibre(false); onChange(''); }}
            className="shrink-0 rounded-xl border border-platino bg-white px-3 py-2 text-xs font-bold text-marino hover:bg-platino-light"
            title="Volver a la lista"
          >
            Lista
          </button>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">Al guardar, aparecerá en la lista para los siguientes registros.</p>
      </label>
    );
  }

  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-marino">Carrera o área</span>
      <select
        value={opciones.includes(value) ? value : ''}
        onChange={(e) => {
          if (e.target.value === OTRA) { setLibre(true); onChange(''); }
          else onChange(e.target.value);
        }}
        className="w-full rounded-xl border border-platino bg-white px-3 py-2.5 text-sm outline-none transition focus:border-azulmedio"
      >
        <option value="">— Sin especificar —</option>
        {opciones.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value={OTRA}>➕ Agregar otra…</option>
      </select>
    </label>
  );
}
