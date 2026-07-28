// ============================================================================
// destinos.js — Resolución del destino de la BASE DE DATOS con cascada.
//
// SICAD puede correr repartido en varias máquinas (frontend, backend y base de
// datos en laptops distintas, red de la Familia 4 del laboratorio). Para que el
// backend encuentre su base de datos sin reconfigurar nada, se prueban varios
// candidatos EN ORDEN y se usa el PRIMERO que responde de verdad:
//
//   1. DATABASE_URL del entorno .......... gana siempre (Azure, manual)
//   2. db ................................ servicio de Docker (todo en una máquina)
//   3. bd.fandite.com .................... nombre DNS de la laptop de BD
//   4. 192.168.13.3 ...................... IP fija de esa laptop (Familia 4)
//   5. localhost ......................... backend suelto en la misma máquina
//
// "Responder de verdad" = aceptar una conexión TCP en el puerto, con un timeout
// corto para no dejar el arranque colgado si una laptop está apagada.
// ============================================================================
const net = require('net');

// Valores por defecto de la red del laboratorio (Familia 4: 192.168.13.0/24).
const HOST_BD_DNS = process.env.DB_HOST_DNS || 'bd.fandite.com';
const HOST_BD_IP = process.env.DB_HOST_IP || '192.168.13.3';
const PUERTO_BD = Number(process.env.DB_PORT || 5432);
const USUARIO_BD = process.env.POSTGRES_USER || 'sicad';
const PASSWORD_BD = process.env.POSTGRES_PASSWORD || 'sicad_pass';
const NOMBRE_BD = process.env.POSTGRES_DB || 'sicad';
const TIMEOUT_MS = Number(process.env.RESOLVE_TIMEOUT_MS || 1500);

// ¿Hay algo escuchando en host:puerto? (prueba TCP con timeout)
function responde(host, puerto, timeout = TIMEOUT_MS) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let listo = false;
    const cerrar = (ok) => {
      if (listo) return;
      listo = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => cerrar(true));
    socket.once('timeout', () => cerrar(false));
    socket.once('error', () => cerrar(false));
    socket.connect(puerto, host);
  });
}

// Arma la cadena de conexión de Postgres para un host dado.
function urlDe(host) {
  return `postgresql://${USUARIO_BD}:${PASSWORD_BD}@${host}:${PUERTO_BD}/${NOMBRE_BD}?schema=public`;
}

// Resuelve la URL de la base de datos siguiendo la cascada descrita arriba.
// Devuelve { url, origen } y deja en consola cuál se eligió.
async function resolverBaseDeDatos() {
  // 1) Si el entorno ya trae DATABASE_URL, se respeta tal cual (Azure/Docker).
  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL, origen: 'variable de entorno DATABASE_URL' };
  }

  // 2/3/4) Se prueban los candidatos en orden hasta que uno conteste.
  const candidatos = [
    // "db" solo resuelve dentro de la red de Docker (todo en una máquina).
    { host: 'db', etiqueta: 'servicio db de Docker' },
    { host: HOST_BD_DNS, etiqueta: `DNS ${HOST_BD_DNS}` },
    { host: HOST_BD_IP, etiqueta: `IP fija ${HOST_BD_IP} (Familia 4)` },
    { host: 'localhost', etiqueta: 'localhost' },
  ];

  for (const c of candidatos) {
    // eslint-disable-next-line no-await-in-loop
    if (await responde(c.host, PUERTO_BD)) {
      return { url: urlDe(c.host), origen: c.etiqueta };
    }
    console.log(`   ↳ sin respuesta en ${c.host}:${PUERTO_BD}, probando el siguiente…`);
  }

  // Ninguno respondió: se usa localhost de todos modos para que el error de
  // Prisma sea claro ("no se pudo conectar") en vez de arrancar sin destino.
  return { url: urlDe('localhost'), origen: 'localhost (ningún destino respondió)' };
}

module.exports = { resolverBaseDeDatos, responde };
