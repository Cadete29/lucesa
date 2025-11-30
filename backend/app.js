/**
 * Configuración principal de la aplicación Express
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const ctonlineRoutes = require('./routes/ctonlineRoutes');
const productosRoutes = require('./routes/productosRoutes');
const diagnosticRoutes = require('./routes/diagnosticRoutes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const imageProxyRoutes = require('./routes/imageProxy');
const categoriasRoutes = require('./routes/categorias');
const orderRoutes = require('./routes/ordersG');
const paymentsRoutes = require('./routes/paymentsG'); // ✅ Asegúrate que esta línea esté presente
const warrantyRoutes = require('./routes/warranties');
const returnRoutes = require('./routes/returns');
const favoritesRoutesG = require('./routes/favoritesRoutesG');

// Importar las rutas principales que tenías en serverG.js
const mainRoutesG = require('./routes/mainRoutesG');

const app = express();

// Configuración CORS (manteniendo tu configuración actual)
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

// Middlewares básicos (incluyendo los límites que tenías en serverG.js)
app.use(express.json({ limit: '10mb' }));
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentsRoutes); // ✅ Asegúrate que esta línea esté presente
app.use('/api/warranties', warrantyRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/favorites', favoritesRoutesG);

// Agregar las rutas principales de serverG.js bajo el prefijo /api
app.use('/api', mainRoutesG);

// Ruta de health check (mejorada)
app.get('/', (req, res) => {
  res.json({
    message: 'API Server funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      productos: '/api/productos',
      ctonline: '/api/ctonline',
      debug: '/api/debug',
      usuarios: '/api/usuarios',
      payments: '/api/payments', // ✅ Añadir payments a la lista
      main: '/api'
    }
  });
});

// Mantener la ruta de prueba de serverG.js en la misma ubicación
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores (debe ir al final)
app.use(errorHandler.notFound);
app.use(errorHandler.general);

module.exports = app;