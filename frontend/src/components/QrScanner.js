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
//
// Props:
//   onScan  -> (texto) => void   se llama con el contenido del QR leído
//   onError -> (mensaje) => void  se llama si no se puede abrir la cámara
// ============================================================================
import { useEffect, useRef } from 'react';

const REGION_ID = 'qr-region';

export default function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  // Refs a los callbacks para no reiniciar la cámara en cada render del padre.
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelado = false;
    let scanner;

    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (cancelado) return;
      scanner = new Html5Qrcode(REGION_ID, { verbose: false });
      scannerRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 220, height: 220 } };
      const alLeer = (texto) => {
        if (!cancelado) onScanRef.current?.(texto);
      };
      const alFallarFrame = () => {}; // ruido normal por frame sin QR; se ignora

      try {
        // Preferimos la cámara trasera (facingMode environment).
        await scanner.start({ facingMode: 'environment' }, config, alLeer, alFallarFrame);
      } catch {
        // Fallback: si no hay cámara trasera (p. ej. laptop), usa la primera disponible.
        try {
          const camaras = await Html5Qrcode.getCameras();
          if (camaras && camaras.length) {
            await scanner.start(camaras[0].id, config, alLeer, alFallarFrame);
          } else {
            throw new Error('sin-camaras');
          }
        } catch {
          if (!cancelado) onErrorRef.current?.('No se pudo abrir la cámara. Revisa los permisos del navegador.');
        }
      }
    })();

    // Limpieza: detiene la cámara al desmontar.
    return () => {
      cancelado = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
      }
    };
  }, []); // se inicia una sola vez

  return <div id={REGION_ID} className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-platino-light" />;
}
