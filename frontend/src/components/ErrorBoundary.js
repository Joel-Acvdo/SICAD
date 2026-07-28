'use client';

// ============================================================================
// ErrorBoundary — atrapa errores de render de sus hijos para que la pantalla
// NO se caiga con el "Application error" genérico de Next.js. Muestra un aviso
// entendible y, si se pasa `respaldo`, ese contenido alternativo.
//
// Se usa, por ejemplo, alrededor del lector de QR: si la cámara no existe o el
// usuario niega el permiso, la terminal sigue usable en vez de romperse.
//
// Props:
//   respaldo -> nodo a mostrar en caso de error (opcional)
//   children -> contenido normal
// ============================================================================
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    // Queda en la consola para diagnóstico; el usuario ve el aviso amable.
    console.error('[SICAD] Error atrapado por ErrorBoundary:', error);
  }

  render() {
    if (this.state.fallo) {
      return (
        this.props.respaldo ?? (
          <div className="w-full rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-xs text-rojo">
            Ocurrió un problema al mostrar esta sección. Recarga la página e inténtalo de nuevo.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
