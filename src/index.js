const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const alumnoRoutes = require('./routes/alumnoRoutes');
const grupoRoutes = require('./routes/grupoRoutes');
const maestroRoutes = require('./routes/maestroRoutes');
const administrativoRoutes = require('./routes/administrativoRoutes');
const cuestionarioRoutes = require('./routes/cuestionarioRoutes');
const verificacionRoutes = require('./routes/verificacionRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'https://tutoriasitl.netlify.app')
    : '*',
  optionsSuccessStatus: 200
};

// Rate limiting (Protección contra DDoS / Fuerza Bruta)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP cada 15 mins
  message: { success: false, message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 peticiones fallidas por IP cada 15 mins
  message: { success: false, message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 15 minutos.' }
});

// Middlewares Globales
app.use(helmet()); // Seguridad de cabeceras HTTP
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Limiter general para todas las rutas
app.use('/api', generalLimiter);

// Limiter estricto para rutas de autenticación
app.use('/api/alumnos/login', loginLimiter);
app.use('/api/maestros/login', loginLimiter);
app.use('/api/administrativos/login', loginLimiter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'API de tutorías funcionando correctamente',
    version: '1.0.0'
  });
});

// Rutas
app.use('/api/alumnos', alumnoRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/maestros', maestroRoutes);
app.use('/api/administrativos', administrativoRoutes);
app.use('/api/cuestionario', cuestionarioRoutes);
app.use('/api/verificacion', verificacionRoutes);
app.use('/api/password', passwordRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Ruta no encontrada' 
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // En producción no enviamos detalles del error al cliente
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor',
    error: isProduction ? undefined : err.message 
  });
});

// Iniciar servidor
const startServer = async () => {
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.error('No se pudo conectar a la base de datos. Verifica tu configuración.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\nServidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();