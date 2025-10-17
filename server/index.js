import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import router from './src/routes/index.js';
import connectDB, { startReconnectTimer } from './src/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:5174', // Vite dev server puerto alternativo
    'http://localhost:3000', // Posible puerto alternativo
    'http://127.0.0.1:5173', // IP alternativa
    'http://127.0.0.1:5174', // IP alternativa puerto 5174
    'http://127.0.0.1:3000'  // IP alternativa
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middlewares
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json());

// Rutas
app.use('/api', router);

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Inicializar conexión a MongoDB (opcional)
const initializeDatabase = async () => {
  const connected = await connectDB();
  if (connected) {
    console.log('🎯 Usando MongoDB para almacenar suscripciones');
  } else {
    console.log('💾 Usando almacenamiento en memoria para suscripciones');
    // Iniciar timer de reconexión
    startReconnectTimer();
  }
};

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌐 CORS habilitado para: ${corsOptions.origin.join(', ')}`);
  
  // Intentar conectar a MongoDB
  await initializeDatabase();
});

export default app;


