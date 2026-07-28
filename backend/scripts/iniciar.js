// ============================================================================
// iniciar.js — Arranque del backend en contenedor.
//
// Resuelve PRIMERO dónde está la base de datos (cascada entorno → Docker → DNS
// → IP fija → localhost, ver src/config/destinos.js) y solo después ejecuta:
//     1. prisma migrate deploy   (crea/actualiza las tablas)
//     2. npm run seed            (datos demo)
//     3. el servidor HTTP
//
// Es necesario porque la CLI de Prisma necesita DATABASE_URL ya resuelta: si se
// ejecutara antes que la resolución, fallaría con "empty string".
// ============================================================================
const { execSync } = require('child_process');
const { resolverBaseDeDatos } = require('../src/config/destinos');

async function main() {
  console.log('🔎 Buscando la base de datos…');
  const { url, origen } = await resolverBaseDeDatos();
  process.env.DATABASE_URL = url;
  console.log(`✅ Base de datos: ${origen}`);
  console.log(`   ${url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')}`);

  const opciones = { stdio: 'inherit', env: process.env };
  console.log('\n📦 Aplicando migraciones…');
  execSync('npx prisma migrate deploy', opciones);

  console.log('\n🌱 Sembrando datos iniciales…');
  execSync('npm run seed', opciones);

  console.log('\n▶️  Iniciando el servidor…');
  require('../src/server'); // ya encuentra DATABASE_URL resuelta y la respeta
}

main().catch((err) => {
  console.error('💥 Fallo al iniciar el backend:', err.message);
  process.exit(1);
});
