/**
 * Configuración principal de la aplicación Express
 * Aquí se configuran todos los middlewares y rutas
 */
const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');
const ctonlineRoutes = require('./routes/ctonlineRoutes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Rutas principales
app.use('/api/usuarios', userRoutes);
app.use('/api/ctonline', ctonlineRoutes);

// Ruta de health check
app.get('/', (req, res) => {
  res.json({
    message: 'API Server funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Manejo de errores (debe ir al final)
app.use(errorHandler.notFound);
app.use(errorHandler.general);

module.exports = app;