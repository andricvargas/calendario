# Guía de Despliegue en Producción

Esta guía te ayudará a preparar y desplegar la aplicación Radial Habit Tracker en producción con PM2 para mantener el servicio activo.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- npm o yarn
- PM2 instalado globalmente: `npm install -g pm2`
- Acceso al servidor (Linux/Windows)

## 🚀 Pasos de Despliegue

### 1. Preparar el Entorno

```bash
# Clonar o copiar el proyecto al servidor
cd /ruta/del/proyecto/calendario

# Instalar dependencias
npm install

# Instalar PM2 globalmente si no está instalado
npm install -g pm2
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# En Linux/Mac
nano .env

# En Windows
notepad .env
```

Copia el siguiente contenido y ajusta los valores:

```env
# Entorno
NODE_ENV=production
PORT=3001

# Autenticación TOTP
# IMPORTANTE: Genera un secret seguro
TOTP_SECRET_SEED=TU_SECRET_TOTP_AQUI

# Sesión
# IMPORTANTE: Genera un secret seguro y único
SESSION_SECRET=TU_SECRET_SESION_AQUI
```

**Generar secrets seguros:**

```bash
# En Linux/Mac
openssl rand -base64 32

# En Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Compilar el Proyecto

```bash
# Compilar tanto el servidor como el cliente
npm run build
```

Esto generará:
- `dist/server/` - Código del servidor compilado
- `dist/` - Archivos estáticos del frontend

### 4. Crear Directorio de Logs

```bash
# Crear directorio para logs de PM2
mkdir -p logs

# En Windows
mkdir logs
```

### 5. Iniciar con PM2

```bash
# Iniciar la aplicación
npm run pm2:start

# O directamente con PM2
pm2 start ecosystem.config.js
```

### 6. Configurar PM2 para Inicio Automático

**En Linux:**

```bash
# Guardar la configuración actual de PM2
pm2 save

# Configurar PM2 para iniciar al arrancar el sistema
pm2 startup

# Seguir las instrucciones que aparecen en pantalla
```

**En Windows:**

Usa `pm2-windows-startup` o configura un servicio de Windows manualmente.

### 7. Verificar el Estado

```bash
# Ver estado de la aplicación
npm run pm2:status

# Ver logs en tiempo real
npm run pm2:logs

# Ver información detallada
pm2 show radial-habit-tracker
```

## 🔧 Comandos Útiles de PM2

```bash
# Iniciar
npm run pm2:start

# Detener
npm run pm2:stop

# Reiniciar
npm run pm2:restart

# Eliminar del proceso
npm run pm2:delete

# Ver logs
npm run pm2:logs

# Ver estado
npm run pm2:status

# Monitoreo en tiempo real
pm2 monit
```

## 🌐 Configuración con Nginx (Opcional)

Si quieres usar Nginx como proxy reverso:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Redirigir a HTTPS (recomendado)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # Certificados SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Archivos estáticos
    location / {
        root /ruta/del/proyecto/calendario/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Seguridad en Producción

### 1. Cambiar Secrets

- ✅ Cambia `TOTP_SECRET_SEED` por un valor seguro
- ✅ Cambia `SESSION_SECRET` por un valor único y seguro
- ✅ No compartas estos valores públicamente

### 2. Configurar HTTPS

- Usa Let's Encrypt para certificados SSL gratuitos
- Configura `secure: true` en las cookies de sesión cuando uses HTTPS

### 3. Firewall

```bash
# En Linux (UFW)
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 4. Actualizar el Código

```bash
# Detener la aplicación
npm run pm2:stop

# Actualizar código (git pull, etc.)
git pull

# Recompilar
npm run build

# Reiniciar
npm run pm2:restart
```

## 📊 Monitoreo

### Ver Métricas

```bash
# Monitoreo en tiempo real
pm2 monit

# Ver información detallada
pm2 show radial-habit-tracker
```

### Logs

Los logs se guardan en:
- `logs/pm2-out.log` - Salida estándar
- `logs/pm2-error.log` - Errores

## 🔄 Actualización de la Aplicación

```bash
# 1. Detener la aplicación
npm run pm2:stop

# 2. Actualizar código
git pull origin main  # o tu rama principal

# 3. Instalar nuevas dependencias (si hay)
npm install

# 4. Recompilar
npm run build

# 5. Reiniciar
npm run pm2:restart
```

## 🐛 Solución de Problemas

### La aplicación no inicia

```bash
# Ver logs de error
npm run pm2:logs

# Verificar que el puerto no esté en uso
# Linux/Mac
lsof -i :3001
# Windows
netstat -ano | findstr :3001

# Verificar variables de entorno
pm2 env 0
```

### La aplicación se detiene

```bash
# Ver logs
npm run pm2:logs

# Verificar memoria
pm2 monit

# Reiniciar manualmente
npm run pm2:restart
```

### Problemas de permisos

```bash
# Asegurar permisos en directorios
chmod -R 755 dist/
chmod -R 755 logs/
chmod -R 755 server/
```

## 📝 Checklist de Producción

- [ ] Node.js 18+ instalado
- [ ] PM2 instalado globalmente
- [ ] Archivo `.env` configurado con secrets seguros
- [ ] Proyecto compilado (`npm run build`)
- [ ] Directorio `logs/` creado
- [ ] Aplicación iniciada con PM2
- [ ] PM2 configurado para inicio automático
- [ ] Firewall configurado (si es necesario)
- [ ] HTTPS configurado (recomendado)
- [ ] Logs monitoreados
- [ ] Backup del archivo `server/progress.csv` configurado

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `npm run pm2:logs`
2. Verifica el estado: `npm run pm2:status`
3. Revisa las variables de entorno: `pm2 env 0`
4. Verifica que el puerto esté disponible

---

**Nota:** Asegúrate de hacer backup regular del archivo `server/progress.csv` que contiene todos los datos de progreso.

