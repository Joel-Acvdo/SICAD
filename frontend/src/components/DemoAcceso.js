'use client';

// ============================================================================
// DemoAcceso — credenciales de demostración de los logins, en 2 renglones
// grises. Un toque en cada renglón COPIA el valor al portapapeles (para no
// teclear nada en la demo). Muestra "Copiado ✓" un instante como confirmación.
// ============================================================================
import { useState } from 'react';

export default function DemoAcceso({ usuario, password }) {
  const [copiado, setCopiado] = useState(''); // 'u' | 'p' | ''

  const copiar = async (texto, cual) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(''), 1500);
    } catch {} // portapapeles no disponible: no pasa nada
  };

  const Renglon = ({ etiqueta, valor, cual }) => (
    <button
      type="button"
      onClick={() => copiar(valor, cual)}
      title="Copiar"
      className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-left transition hover:bg-slate-200"
    >
      <span className="text-[11px] font-semibold text-slate-400">{etiqueta}</span>
      <span className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
        {valor}
        {copiado === cual ? (
          <svg className="h-3.5 w-3.5 text-verde" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h4a2 2 0 002-2M8 5a2 2 0 012-2h4a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>
        )}
      </span>
    </button>
  );

  return (
    <div className="mt-6 space-y-1.5">
      <p className="text-center text-[11px] font-semibold text-slate-400">Acceso de demostración · toca para copiar</p>
      <Renglon etiqueta="Usuario" valor={usuario} cual="u" />
      <Renglon etiqueta="Contraseña" valor={password} cual="p" />
    </div>
  );
}
