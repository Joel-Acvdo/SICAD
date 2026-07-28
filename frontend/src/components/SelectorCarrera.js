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

// Mensaje de error opcional: pinta el control en rojo y lo muestra debajo.
function TextoError({ error }) {
  if (!error) return null;
  return (
    <span className="mt-1 flex items-start gap-1 text-xs font-medium text-rojo">
      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>
      {error}
    </span>
  );
}

export default function SelectorCarrera({ value = '', onChange, existentes = [], className = '', error }) {
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
            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
              error ? 'border-rojo bg-red-50 focus:border-rojo' : 'border-platino bg-white focus:border-azulmedio'
            }`}
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
        <TextoError error={error} />
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
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
          error ? 'border-rojo bg-red-50 focus:border-rojo' : 'border-platino bg-white focus:border-azulmedio'
        }`}
      >
        <option value="">— Selecciona una carrera o área —</option>
        {opciones.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value={OTRA}>➕ Agregar otra…</option>
      </select>
      <TextoError error={error} />
    </label>
  );
}
