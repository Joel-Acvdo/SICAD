'use client';

// ============================================================================
// QrCode — Código QR REAL (escaneable) para la credencial digital.
// Es el método de acceso: se escanea en la terminal de un punto de acceso.
// Usa la librería qrcode.react; el valor codificado es el código de la credencial.
//
// Props:
//   value -> texto que se codifica en el QR (ej. el codigo_qr)
//   size  -> tamaño del QR en px (sin contar el marco blanco)
// ============================================================================
import { QRCodeSVG } from 'qrcode.react';

export default function QrCode({ value, size = 56 }) {
  return (
    <div className="rounded-lg bg-white p-1.5">
      <QRCodeSVG value={value || 'SICAD'} size={size} bgColor="#ffffff" fgColor="#14274E" level="M" />
    </div>
  );
}
