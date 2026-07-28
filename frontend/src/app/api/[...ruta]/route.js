// ============================================================================
// Proxy /api/* → backend.
//
// El navegador (y los celulares) solo hablan con ESTE servidor; Next reenvía la
// petición al backend, que puede estar en OTRA laptop. Ventajas:
//   · Un solo origen → sin CORS y sin "contenido mixto" al usar HTTPS.
//   · El destino se resuelve en caliente (entorno → DNS → IP fija → localhost)
//     y se revalida cada 30 s: si el backend cambia de máquina, se reencuentra
//     solo, sin reiniciar el frontend. Ver lib/backendDestino.js.
//
// Se reenvían método, cabeceras (incluido el token JWT) y cuerpo tal cual.
// ============================================================================
import { NextResponse } from 'next/server';
import { obtenerBackend } from '@/lib/backendDestino';

// Nunca cachear: es un proxy de API.
export const dynamic = 'force-dynamic';

// Cabeceras que NO se deben reenviar (las administra el propio fetch/servidor).
const OMITIR = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'transfer-encoding']);

async function manejar(request, { params }) {
  const backend = await obtenerBackend();
  if (!backend) {
    return NextResponse.json(
      { error: 'No se pudo contactar al servidor de SICAD. Verifica que el backend esté encendido y en la red.' },
      { status: 503 }
    );
  }

  const { ruta } = await params; // segmentos después de /api
  const { search } = new URL(request.url);
  const destino = `${backend}/api/${(ruta || []).join('/')}${search}`;

  // Copia de cabeceras, quitando las que no viajan.
  const headers = new Headers();
  request.headers.forEach((valor, clave) => {
    if (!OMITIR.has(clave.toLowerCase())) headers.set(clave, valor);
  });

  const opciones = { method: request.method, headers, cache: 'no-store' };
  if (!['GET', 'HEAD'].includes(request.method)) {
    opciones.body = await request.arrayBuffer(); // JSON, fotos en base64, etc.
  }

  try {
    const respuesta = await fetch(destino, opciones);
    const cuerpo = await respuesta.arrayBuffer();
    const salida = new Headers(respuesta.headers);
    salida.delete('content-encoding');
    salida.delete('content-length');
    return new NextResponse(cuerpo, { status: respuesta.status, headers: salida });
  } catch {
    return NextResponse.json(
      { error: 'No hay conexión con el servidor de SICAD. Inténtalo de nuevo en unos segundos.' },
      { status: 503 }
    );
  }
}

export const GET = manejar;
export const POST = manejar;
export const PUT = manejar;
export const PATCH = manejar;
export const DELETE = manejar;
export const HEAD = manejar;
export const OPTIONS = manejar;
