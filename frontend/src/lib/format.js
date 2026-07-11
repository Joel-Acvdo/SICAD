// Utilidades de formato para fechas y nombres (modo demo).

// Vigencia en formato MM/AAAA.
export function formatVigencia(dateStr) {
  try {
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '12/2026';
  }
}

// Fecha y hora de un acceso: "Hoy · 08:14", "Ayer · 18:45" o "10/07 · 09:15".
export function formatFechaHora(dateStr) {
  try {
    const d = new Date(dateStr);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (d.toDateString() === hoy.toDateString()) return `Hoy · ${hora}`;
    if (d.toDateString() === ayer.toDateString()) return `Ayer · ${hora}`;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes} · ${hora}`;
  } catch {
    return 'Hoy · 08:00';
  }
}

export function horaActual() {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const nombreCompleto = (u) => (u ? `${u.nombre} ${u.apellidos}` : '');
