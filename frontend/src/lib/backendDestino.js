// ============================================================================
// backendDestino.js — Encuentra DÓNDE está el backend, del lado del servidor.
//
// SICAD puede correr repartido en varias laptops (frontend, backend y base de
// datos por separado, red de la Familia 4 del laboratorio). Este módulo prueba
// varios candidatos EN ORDEN y se queda con el primero que responde:
//
//   1. BACKEND_URL del entorno .......... gana siempre (Azure, manual)
//   2. http://backend:4000 .............. servicio de Docker (todo en una máquina)
//   3. http://backend.fandite.com:4000 .. nombre DNS de la laptop del backend
//   4. http://192.168.13.2:4000 ......... IP fija de esa laptop (Familia 4)
//   5. http://localhost:4000 ............ frontend suelto en la misma máquina
//
// El resultado se guarda en caché unos segundos y se REVALIDA: si la laptop del
// backend se apaga, se reinicia o cambia de IP, el frontend la reencuentra solo
// sin necesidad de reiniciar nada.
//
// Solo se ejecuta en el servidor de Next (nunca en el navegador).
// ============================================================================

const DNS_BACKEND = process.env.BACKEND_HOST_DNS || 'backend.fandite.com';
const IP_BACKEND = process.env.BACKEND_HOST_IP || '192.168.13.2';
const PUERTO_BACKEND = process.env.BACKEND_PORT || '4000';
const TIMEOUT_MS = Number(process.env.RESOLVE_TIMEOUT_MS || 1500);
const VIGENCIA_MS = Number(process.env.RESOLVE_CACHE_MS || 30000); // revalida cada 30 s

// Candidatos en orden de preferencia.
function candidatos() {
  const lista = [];
  if (process.env.BACKEND_URL) {
    lista.push({ url: process.env.BACKEND_URL.replace(/\/$/, ''), etiqueta: 'BACKEND_URL del entorno' });
  }
  // "backend" solo resuelve dentro de la red de Docker (todo en una máquina).
  lista.push({ url: `http://backend:${PUERTO_BACKEND}`, etiqueta: 'servicio backend de Docker' });
  lista.push({ url: `http://${DNS_BACKEND}:${PUERTO_BACKEND}`, etiqueta: `DNS ${DNS_BACKEND}` });
  lista.push({ url: `http://${IP_BACKEND}:${PUERTO_BACKEND}`, etiqueta: `IP fija ${IP_BACKEND} (Familia 4)` });
  lista.push({ url: `http://localhost:${PUERTO_BACKEND}`, etiqueta: 'localhost' });
  return lista;
}

// ¿Este backend está vivo? Se pregunta por su endpoint de salud.
async function estaVivo(url) {
  try {
    const control = new AbortController();
    const t = setTimeout(() => control.abort(), TIMEOUT_MS);
    const r = await fetch(`${url}/api/health`, { signal: control.signal, cache: 'no-store' });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

// Caché del destino elegido (vive en el proceso del servidor de Next).
let cache = { url: null, etiqueta: null, hasta: 0 };
let enCurso = null; // evita resolver muchas veces a la vez

async function resolver() {
  for (const c of candidatos()) {
    // eslint-disable-next-line no-await-in-loop
    if (await estaVivo(c.url)) {
      if (cache.url !== c.url) console.log(`[SICAD] Backend encontrado en ${c.url} (${c.etiqueta})`);
      cache = { url: c.url, etiqueta: c.etiqueta, hasta: Date.now() + VIGENCIA_MS };
      return cache.url;
    }
  }
  // Ninguno respondió: se conserva el último bueno (si lo hubo) para no romper
  // por un parpadeo de red; si nunca hubo, se devuelve null.
  console.warn('[SICAD] Ningún backend respondió (DNS, IP fija ni localhost).');
  cache = { ...cache, hasta: Date.now() + 5000 }; // reintenta pronto
  return cache.url;
}

// Devuelve la URL del backend, usando la caché mientras siga vigente.
export async function obtenerBackend() {
  if (cache.url && Date.now() < cache.hasta) return cache.url;
  if (!enCurso) {
    enCurso = resolver().finally(() => {
      enCurso = null;
    });
  }
  return enCurso;
}
