module.exports = {
  apps: [
    {
      name: 'radial-habit-tracker',
      script: './dist/server/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Configuración de logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto-restart en caso de fallo
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Watch (solo en desarrollo, desactivar en producción)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log', 'dist'],
      
      // Variables de entorno desde archivo .env
      env_file: '.env',
    },
  ],
};

