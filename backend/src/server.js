// Punto de entrada: arranca el servidor HTTP.
const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`🚀 SICAD API escuchando en http://localhost:${port}`);
  console.log(`   Health: http://localhost:${port}/api/health`);
});
