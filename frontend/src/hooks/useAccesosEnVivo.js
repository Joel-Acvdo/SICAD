'use client';

// ============================================================================
// useAccesosEnVivo — HOOK PERSONALIZADO de SICAD (Programación Reactiva).
//
// ¿Qué hace?
//   Mantiene la lista de accesos (bitácora) SINCRONIZADA con el servidor sin
//   recargar la página: consulta GET /api/accesos cada `intervalo` ms y expone
//   el resultado como estado de React. Cuando entra un registro nuevo, además
//   enciende la bandera `hayNuevo` un momento (útil para animar un aviso).
//
// ¿Por qué es un hook?
//   Encapsula lógica con estado + efectos (polling, limpieza del intervalo,
//   detección de cambios) para reutilizarla en cualquier componente con una
//   sola línea, en lugar de repetir useEffect/setInterval en cada pantalla.
//
// Uso:
//   const { accesos, cargando, ultimaActualizacion, hayNuevo } = useAccesosEnVivo();
//   // o configurado:
//   useAccesosEnVivo({ intervalo: 3000, activo: enPantalla });
//
// Parámetros (opcionales):
//   intervalo -> ms entre consultas (default 5000).
//   activo    -> false = pausa el sondeo (p. ej. al salir de la vista).
//
// Devuelve:
//   accesos             -> array de accesos (orden: más reciente primero).
//   cargando            -> true solo durante la PRIMERA carga.
//   ultimaActualizacion -> Date de la última respuesta buena del servidor.
//   hayNuevo            -> true ~3s cuando llegó un acceso que no estaba.
//
// Dónde se usa: la bitácora de Caseta (tiempo real). La bitácora de Admin se
// queda estática a propósito, para no interrumpir el uso de filtros.
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export default function useAccesosEnVivo({ intervalo = 5000, activo = true } = {}) {
  const [accesos, setAccesos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [hayNuevo, setHayNuevo] = useState(false);

  // ID del acceso más reciente que ya conocemos (para detectar los nuevos).
  // Va en un ref para no reiniciar el efecto en cada actualización.
  const topIdRef = useRef(null);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false; // evita setState si el componente ya se desmontó

    const tick = async () => {
      try {
        const { data } = await api.get('/accesos');
        if (cancelado) return;
        setAccesos(data.accesos);
        setUltimaActualizacion(new Date());
        const top = data.accesos?.[0]?.id_acceso ?? 0;
        if (topIdRef.current !== null && top > topIdRef.current) setHayNuevo(true);
        topIdRef.current = top;
      } catch {
        // Sin red un momento: se reintenta en el siguiente tick.
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    tick(); // primera carga inmediata
    const id = setInterval(tick, intervalo);
    return () => { cancelado = true; clearInterval(id); };
  }, [intervalo, activo]);

  // La bandera de "nuevo" se apaga sola a los 3s (dura lo que la animación).
  useEffect(() => {
    if (!hayNuevo) return;
    const t = setTimeout(() => setHayNuevo(false), 3000);
    return () => clearTimeout(t);
  }, [hayNuevo]);

  return { accesos, cargando, ultimaActualizacion, hayNuevo };
}
