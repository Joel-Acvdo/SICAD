// Configuración de la aplicación Express (sin arrancar el servidor).
// Se exporta para poder reutilizarla en las pruebas con supertest.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Todas las rutas bajo /api
app.use('/api', routes);

// Manejo de rutas no encontradas y errores
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
