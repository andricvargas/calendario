import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'radial-habit-tracker-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// CORS - Configuración para desarrollo y producción
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // En desarrollo, permitir cualquier origen de localhost
  if (isDevelopment) {
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  } else {
    // En producción, usar CORS_ORIGIN si está configurado
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : [];
    
    if (allowedOrigins.length > 0 && origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware para logging de peticiones (solo para rutas importantes, no para status checks)
app.use((_req, _res, next) => {
  // Solo loguear peticiones que no sean checks de estado frecuentes
  if (!_req.path.includes('/status') && !_req.path.includes('/ping')) {
    console.log(`[Server] ${_req.method} ${_req.path}`);
  }
  next();
});

// Rutas API
import authRoutes from './routes/authRoutes.js';
import progressRoutes from './routes/progressRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/test', (_req, res) => {
  console.log('[Server] GET /api/test - Servidor respondiendo');
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Ruta de prueba simple para verificar conectividad
app.get('/api/ping', (_req, res) => {
  console.log('[Server] GET /api/ping - Ping recibido');
  res.json({ status: 'ok', timestamp: Date.now() });
});

// En desarrollo, redirigir la raíz al frontend de Vite
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => {
    res.redirect('http://localhost:3000');
  });
  
  // Para cualquier otra ruta que no sea /api, mostrar mensaje
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.status(404).send(`
        <html>
          <head>
            <title>Servidor Backend</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #333; }
              p { color: #666; }
              a { color: #2196F3; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>Servidor Backend API</h1>
            <p>Este es el servidor backend (puerto 3001).</p>
            <p>Para acceder a la aplicación, ve a: <a href="http://localhost:3000">http://localhost:3000</a></p>
            <p>Las rutas API están disponibles en: <code>/api/*</code></p>
          </body>
        </html>
      `);
    }
  });
}

// Servir archivos estáticos en producción (ANTES del catch-all)
if (process.env.NODE_ENV === 'production') {
  // __dirname es dist/server/, así que ../ va a dist/
  const distPath = path.join(__dirname, '..');
  
  // Servir archivos estáticos del frontend (JS, CSS, imágenes, etc.)
  // express.static maneja automáticamente los archivos y devuelve 404 si no existen
  app.use(express.static(distPath, {
    index: false // No servir index.html automáticamente para rutas raíz
  }));
  
  // Para cualquier ruta que no sea /api, servir index.html (SPA routing)
  // express.static ya manejó los archivos estáticos, así que esto solo captura rutas SPA
  app.get('*', (req, res, next) => {
    // Si es una ruta de API, devolver 404
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    // Si la ruta tiene extensión, express.static ya la manejó (o devolvió 404)
    // Solo servir index.html para rutas sin extensión (rutas SPA)
    if (req.path.includes('.')) {
      return next(); // Dejar que express.static maneje el 404
    }
    // Para cualquier otra ruta, servir index.html (SPA)
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Middleware de manejo de errores global (debe ir al final)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ API routes available at http://0.0.0.0:${PORT}/api/*`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`✅ Frontend available at http://0.0.0.0:${PORT}`);
  } else {
    console.log(`✅ Frontend should be accessed at http://localhost:3000`);
  }
});

