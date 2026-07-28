'use client';

// ============================================================================
// QrScanner — Lector de código QR por CÁMARA para la terminal de acceso.
// Abre la cámara del dispositivo (celular, tablet o laptop) y, al reconocer un
// código, invoca onScan(texto) con el contenido del QR (el codigo_qr).
//
// Usa la librería html5-qrcode, que se importa de forma dinámica dentro del
// efecto para no romper el render del lado del servidor (SSR) de Next.js.
//
// La cámara requiere contexto seguro: funciona en https:// y en http://localhost.
// Si no hay cámara, se niega el permiso o falla la librería, NO se rompe la
// pantalla (BUG-C): se avisa por onError y la terminal sigue utilizable.
//
// Props:
//   onScan  -> (texto) => void    se llama con el contenido del QR leído
//   onError -> (mensaje) => void  se llama si no se puede abrir la cámara
// ============================================================================
import { useEffect, useRef } from 'react';

const REGION_ID = 'qr-region';

// Traduce el fallo técnico a un mensaje que el guardia entienda.
function mensajeDeError(err) {
  const texto = String(err?.name || err?.message || err || '');
  if (/NotAllowedError|Permission/i.test(texto)) {
    return 'Permiso de cámara denegado. Actívalo en el navegador y recarga la página.';
  }
  if (/NotFoundError|sin-camaras|device not found/i.test(texto)) {
    return 'No se detectó ninguna cámara en este dispositivo.';
  }
  if (/NotReadableError|TrackStartError/i.test(texto)) {
    return 'La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.';
  }
  if (/secure context|getUserMedia/i.test(texto)) {
    return 'La cámara solo funciona por HTTPS o en localhost.';
  }
  return 'No se pudo abrir la cámara. Revisa los permisos del navegador.';
}

export default function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const activoRef = useRef(false); // ¿la cámara llegó a arrancar?
  // Refs a los callbacks para no reiniciar la cámara en cada render del padre.
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        // Sin soporte de cámara (http:// en el celular, navegador viejo…).
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          onErrorRef.current?.('Este navegador no permite usar la cámara (se requiere HTTPS o localhost).');
          return;
        }

        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelado) return;

        const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
        scannerRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 220, height: 220 } };
        const alLeer = (texto) => {
          if (!cancelado) onScanRef.current?.(texto);
        };
        const alFallarFrame = () => {}; // ruido normal por frame sin QR; se ignora

        try {
          // Preferimos la cámara trasera (facingMode environment).
          await scanner.start({ facingMode: 'environment' }, config, alLeer, alFallarFrame);
          activoRef.current = true;
        } catch (errTrasera) {
          // Fallback: si no hay cámara trasera (p. ej. laptop), usa la primera disponible.
          try {
            const camaras = await Html5Qrcode.getCameras();
            if (camaras && camaras.length) {
              await scanner.start(camaras[0].id, config, alLeer, alFallarFrame);
              activoRef.current = true;
            } else {
              throw new Error('sin-camaras');
            }
          } catch (errFinal) {
            if (!cancelado) onErrorRef.current?.(mensajeDeError(errFinal || errTrasera));
          }
        }
      } catch (err) {
        // Cualquier otro fallo (carga de la librería, contexto inseguro…):
        // se reporta y la pantalla sigue en pie en vez de caerse.
        if (!cancelado) onErrorRef.current?.(mensajeDeError(err));
      }
    })();

    // Limpieza: detiene la cámara SOLO si llegó a arrancar (stop() lanza si no).
    return () => {
      cancelado = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s || !activoRef.current) return;
      activoRef.current = false;
      Promise.resolve()
        .then(() => s.stop())
        .then(() => s.clear())
        .catch(() => {}); // si ya estaba detenido, no pasa nada
    };
  }, []); // se inicia una sola vez

  return <div id={REGION_ID} className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-platino-light" />;
}
