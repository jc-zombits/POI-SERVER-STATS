const express = require('express');
const cors = require('cors');
const app = express();

// Configuración CORS mejorada
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3002'], // Permitir ambos puertos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Middlewares
app.use(express.json());

// Manejar preflight requests
app.options('*', cors(corsOptions));

// Rutas
const poiRoutes = require('./src/routes/poi.routes');
app.use('/api', poiRoutes);

// Arranque del servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});