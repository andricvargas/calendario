# Guía Paso a Paso: Dónde Ejecutar y Cómo Mover Archivos

## 📍 ¿Dónde Ejecutar la Aplicación?

Tienes varias opciones:

### Opción 1: Servidor Dedicado (VPS/Cloud)
- **Ubuntu/Debian en servidor remoto** (DigitalOcean, AWS, Azure, etc.)
- **Windows Server** en servidor remoto
- **Tu propia máquina** si tiene IP pública

### Opción 2: Servidor Local
- **Tu computadora actual** (para pruebas o uso personal)
- **Servidor en tu red local**

### Opción 3: Servicio en la Nube
- **Heroku, Railway, Render** (Plataformas como servicio)

---

## 🚚 Cómo Mover los Archivos

### Método 1: Usando Git (Recomendado)

Si tu código está en un repositorio Git:

```bash
# En el servidor de producción
cd /ruta/donde/quieres/la/app
git clone https://github.com/tu-usuario/calendario.git
cd calendario
npm install
```

**Ventajas:**
- ✅ Fácil de actualizar con `git pull`
- ✅ Control de versiones
- ✅ No necesitas transferir archivos manualmente

### Método 2: SCP (Linux/Mac a Linux)

Desde tu computadora local:

```bash
# Comprimir el proyecto (excluyendo node_modules y dist)
tar -czf calendario.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='logs' \
  calendario/

# Transferir al servidor
scp calendario.tar.gz usuario@servidor:/ruta/destino/

# En el servidor, descomprimir
ssh usuario@servidor
cd /ruta/destino
tar -xzf calendario.tar.gz
cd calendario
npm install
```

### Método 3: FTP/SFTP (FileZilla, WinSCP)

1. **Conectar al servidor** con FileZilla o WinSCP
2. **Subir los archivos** (excluyendo `node_modules`, `dist`, `.git`)
3. **En el servidor**, ejecutar:
   ```bash
   cd /ruta/donde/subiste/los/archivos
   npm install
   ```

### Método 4: USB/Copia Manual (Windows)

1. **Copiar la carpeta** del proyecto a una USB
2. **En el servidor**, copiar desde USB
3. **Abrir terminal** en la carpeta del proyecto
4. **Ejecutar:**
   ```bash
   npm install
   ```

---

## 📂 Estructura de Archivos Necesaria

Cuando muevas los archivos, asegúrate de incluir:

```
calendario/
├── src/                    ✅ Necesario (código fuente)
├── server/                  ✅ Necesario (código del servidor)
│   ├── routes/             ✅ Necesario
│   ├── middleware/         ✅ Necesario
│   ├── progress.csv        ⚠️  Crear si no existe (datos)
│   └── habit-config.txt    ⚠️  Crear si no existe (config)
├── package.json            ✅ Necesario
├── tsconfig.json           ✅ Necesario
├── tsconfig.server.json    ✅ Necesario
├── vite.config.ts          ✅ Necesario
├── ecosystem.config.js     ✅ Necesario (PM2)
├── .env                    ⚠️  Crear manualmente (no subir)
└── README.md               ✅ Útil
```

**NO necesitas subir:**
- ❌ `node_modules/` (se instala con `npm install`)
- ❌ `dist/` (se genera con `npm run build`)
- ❌ `.git/` (opcional, solo si usas Git)
- ❌ `logs/` (se crea automáticamente)
- ❌ `.env` (crear en el servidor)

---

## 🖥️ Ejemplo Práctico: Despliegue en Servidor Linux

### Paso 1: Preparar Archivos Localmente

```bash
# En tu computadora (Windows)
cd C:\Users\avargas\Proyectos\calendario

# Crear archivo .zip sin node_modules y dist
# (Puedes usar WinRAR o 7-Zip)
# Seleccionar todos los archivos EXCEPTO:
# - node_modules
# - dist
# - .git
# - logs
```

### Paso 2: Transferir al Servidor

**Opción A: Con SCP (si tienes acceso SSH)**
```bash
# Desde PowerShell o Git Bash
scp -r calendario usuario@servidor:/home/usuario/apps/
```

**Opción B: Con FileZilla/WinSCP**
1. Conectar al servidor
2. Navegar a `/home/usuario/apps/`
3. Subir la carpeta `calendario`

**Opción C: Con Git**
```bash
# En el servidor
cd /home/usuario/apps
git clone https://github.com/tu-usuario/calendario.git
```

### Paso 3: En el Servidor

```bash
# Conectar al servidor
ssh usuario@servidor

# Ir a la carpeta
cd /home/usuario/apps/calendario

# Instalar dependencias
npm install

# Crear archivo .env
nano .env
# Pegar el contenido (ver abajo)

# Compilar
npm run build

# Iniciar con PM2
npm run pm2:start
```

---

## 📝 Crear Archivo .env en el Servidor

```bash
# En el servidor
cd /home/usuario/apps/calendario
nano .env
```

Pegar este contenido (ajustar valores):

```env
NODE_ENV=production
PORT=3001
TOTP_SECRET_SEED=JBSWY3DPEHPK3PXP
SESSION_SECRET=cambiar-por-secret-seguro
```

Guardar: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🪟 Ejemplo Práctico: Despliegue en Windows Server

### Paso 1: Copiar Archivos

1. **Comprimir** la carpeta `calendario` (excluyendo `node_modules`, `dist`)
2. **Copiar** al servidor Windows (USB, red, RDP)
3. **Descomprimir** en `C:\apps\calendario\`

### Paso 2: En el Servidor Windows

```powershell
# Abrir PowerShell como Administrador
cd C:\apps\calendario

# Instalar dependencias
npm install

# Crear archivo .env
notepad .env
# Pegar contenido y guardar

# Compilar
npm run build

# Iniciar con PM2
npm run pm2:start
```

---

## 🌐 Ejemplo: Despliegue en tu Computadora Actual

Si solo quieres ejecutarlo en tu PC actual:

```powershell
# En PowerShell
cd C:\Users\avargas\Proyectos\calendario

# Crear .env si no existe
if (-not (Test-Path .env)) {
    @"
NODE_ENV=production
PORT=3001
TOTP_SECRET_SEED=JBSWY3DPEHPK3PXP
SESSION_SECRET=mi-secret-local
"@ | Out-File -FilePath .env -Encoding utf8
}

# Compilar
npm run build

# Iniciar con PM2
npm run pm2:start
```

---

## 🔍 Verificar que Funciona

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs radial-habit-tracker

# Probar en navegador
# http://localhost:3001/api/test
# Debería mostrar: {"message":"Server is running",...}
```

---

## 📋 Checklist de Despliegue

- [ ] Archivos transferidos al servidor
- [ ] `npm install` ejecutado
- [ ] Archivo `.env` creado y configurado
- [ ] `npm run build` ejecutado exitosamente
- [ ] PM2 instalado (`npm install -g pm2`)
- [ ] `npm run pm2:start` ejecutado
- [ ] `pm2 status` muestra la app corriendo
- [ ] Servidor responde en el puerto configurado
- [ ] PM2 configurado para inicio automático (`pm2 save` y `pm2 startup`)

---

## ❓ ¿Dónde Está Mi Servidor?

Si no tienes un servidor, opciones:

1. **Tu PC actual** - Para uso personal
2. **Servidor VPS** - DigitalOcean ($5/mes), Linode, Vultr
3. **Cloud gratuito** - Railway, Render (tier gratuito)
4. **Servidor en casa** - Raspberry Pi, PC viejo con Linux

---

## 🆘 Problemas Comunes

### "No se encuentra el módulo"
```bash
# Solución: Reinstalar dependencias
rm -rf node_modules
npm install
```

### "Puerto en uso"
```bash
# Ver qué está usando el puerto
# Linux
lsof -i :3001
# Windows
netstat -ano | findstr :3001

# Cambiar puerto en .env
PORT=3002
```

### "Permiso denegado"
```bash
# Dar permisos de ejecución (Linux)
chmod +x start-production.sh
```

---

¿Necesitas ayuda con algún paso específico? Indica:
- ¿Dónde quieres ejecutar la app? (tu PC, servidor Linux, Windows Server, etc.)
- ¿Cómo quieres transferir los archivos? (Git, SCP, USB, etc.)

