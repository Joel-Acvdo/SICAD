// Utilidades de formato para fechas y nombres (modo demo).

// Vigencia con día incluido: DD/MM/AAAA (antes solo mostraba mes y año).
export function formatVigencia(dateStr) {
  try {
    const d = new Date(dateStr);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${d.getFullYear()}`;
  } catch {
    return '31/12/2026';
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

// ---------------------------------------------------------------------------
// Fechas en formato AAAA-MM-DD, que es el que entienden los <input type="date">.
// ---------------------------------------------------------------------------
export function aISO(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Hoy (mínimo permitido al elegir una vigencia).
export const hoyISO = () => aISO(new Date());

// Hoy + 2 años (máximo permitido: la vigencia no puede pasar de 2 años).
export function maximoISO() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return aISO(d);
}

// Hace N días (para los presets de los filtros: "últimos 7 días").
export function haceDiasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return aISO(d);
}

export function horaActual() {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const nombreCompleto = (u) => (u ? `${u.nombre} ${u.apellidos}` : '');

// ---------------------------------------------------------------------------
// Búsqueda tolerante: deja el texto en minúsculas, SIN acentos y SIN caracteres
// especiales, para que la búsqueda no falle por cómo se escriba.
//   "José Pérez"  →  "jose perez"      "UP-230571" → "up230571"
//   "  Nuñez!! "  →  "nunez"           "@#$"       → ""  (se ignora)
// ---------------------------------------------------------------------------
export function normalizarTexto(texto = '') {
  return String(texto)
    .normalize('NFD')                 // separa las letras de sus acentos
    .replace(/[̀-ͯ]/g, '')  // quita los acentos (á→a, ñ→n)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')      // quita signos y caracteres especiales
    .replace(/\s+/g, ' ')             // colapsa espacios repetidos
    .trim();
}

// ¿El texto contiene lo buscado, ignorando acentos y caracteres especiales?
// Si la búsqueda queda vacía tras normalizar (p. ej. solo "@#$"), no filtra nada.
export function coincide(texto, busqueda) {
  const b = normalizarTexto(busqueda);
  if (!b) return true;
  return normalizarTexto(texto).includes(b);
}
