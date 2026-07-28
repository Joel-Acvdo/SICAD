// Punto de entrada: resuelve dónde está la base de datos y arranca el servidor.
//
// El orden importa: primero se resuelve DATABASE_URL (cascada
// entorno → DNS → IP fija → localhost, ver config/destinos.js) y HASTA DESPUÉS
// se carga la app, porque al cargarse crea el cliente Prisma con esa URL.
const { resolverBaseDeDatos } = require('./config/destinos');

async function iniciar() {
  console.log('🔎 Buscando la base de datos…');
  const { url, origen } = await resolverBaseDeDatos();
  process.env.DATABASE_URL = url;
  console.log(`✅ Base de datos: ${origen}`);
  // Se oculta la contraseña al imprimir la cadena de conexión.
  console.log(`   ${url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')}`);

  // Ahora sí: cargar la app (y con ella, el cliente Prisma).
  const app = require('./app');
  const { port } = require('./config/env');

  // 0.0.0.0 = escucha en todas las interfaces, para que el frontend pueda
  // llamarlo desde OTRA laptop de la red (no solo desde esta máquina).
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 SICAD API escuchando en el puerto ${port} (todas las interfaces)`);
    console.log(`   Health: http://localhost:${port}/api/health`);
  });
}

iniciar().catch((err) => {
  console.error('💥 No se pudo iniciar el servidor:', err);
  process.exit(1);
});
