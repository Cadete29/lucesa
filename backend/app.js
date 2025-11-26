/**
 * Configuración principal de la aplicación Express
 */
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const ctonlineRoutes = require('./routes/ctonlineRoutes');
const productosRoutes = require('./routes/productosRoutes');
const diagnosticRoutes = require('./routes/diagnosticRoutes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const imageProxyRoutes = require('./routes/imageProxy');
const categoriasRoutes = require('./routes/categorias');

const app = express();

// Configuración CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://testpaginaweb.shop',
    'https://www.testpaginaweb.shop'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

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
app.use('/api/productos', productosRoutes);
app.use('/api/debug', diagnosticRoutes);
app.use('/api/images', imageProxyRoutes);
app.use('/api/categorias', categoriasRoutes);

// Ruta de health check
app.get('/', (req, res) => {
  res.json({
    message: 'API Server funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      productos: '/api/productos',
      ctonline: '/api/ctonline',
      debug: '/api/debug',
      usuarios: '/api/usuarios'
    }
  });
});

// Manejo de errores (debe ir al final)
app.use(errorHandler.notFound);
app.use(errorHandler.general);

module.exports = app;