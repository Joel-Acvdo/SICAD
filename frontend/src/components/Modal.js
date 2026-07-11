'use client';

// ============================================================================
// Modal — Diálogo centrado sobre un fondo oscurecido. Reutilizable para
// confirmaciones y avisos (revocar, reportar pérdida, renovar, etc.).
//
// Props:
//   children -> el contenido del diálogo
//   onClose  -> función que cierra el modal (se llama al hacer clic en el fondo)
// ============================================================================
export default function Modal({ children, onClose }) {
  return (
    // Capa de fondo: cubre toda la pantalla; clic aquí = cerrar.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-marino-dark/80 p-4 animate-fade-in" onClick={onClose}>
      {/* Caja del diálogo: stopPropagation evita que un clic dentro cierre el modal. */}
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
