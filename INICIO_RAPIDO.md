# 🚀 Inicio Rápido - Producción

## Escenario 1: Ejecutar en tu PC actual

### Paso 1: Preparar
```powershell
# Abrir PowerShell en la carpeta del proyecto
cd C:\Users\avargas\Proyectos\calendario
```

### Paso 2: Crear .env
```powershell
# Crear archivo .env
@"
NODE_ENV=production
PORT=3001
TOTP_SECRET_SEED=JBSWY3DPEHPK3PXP
SESSION_SECRET=mi-secret-cambiar-en-produccion
"@ | Out-File -FilePath .env -Encoding utf8
```

### Paso 3: Instalar PM2
```powershell
npm install -g pm2
```

### Paso 4: Compilar y Ejecutar
```powershell
# Compilar
npm run build

# Iniciar
npm run pm2:start
```

### Paso 5: Verificar
```powershell
# Ver estado
pm2 status

# Ver logs
pm2 logs
```

**¡Listo!** La app está corriendo en `http://localhost:3001`

---

## Escenario 2: Mover a Servidor Linux

### Opción A: Con Git (Más Fácil)

**En el servidor:**
```bash
# Conectar al servidor
ssh usuario@servidor

# Clonar proyecto
cd /home/usuario
git clone https://github.com/tu-usuario/calendario.git
cd calendario

# Instalar dependencias
npm install

# Crear .env
nano .env
# Pegar contenido y guardar (Ctrl+O, Enter, Ctrl+X)

# Compilar
npm run build

# Iniciar
npm run pm2:start
```

### Opción B: Transferir Archivos Manualmente

**En tu PC (Windows):**
1. Comprimir carpeta `calendario` (excluir `node_modules`, `dist`, `.git`)
2. Usar FileZilla/WinSCP para subir al servidor

**En el servidor:**
```bash
# Descomprimir
cd /home/usuario
unzip calendario.zip
cd calendario

# Instalar dependencias
npm install

# Crear .env
nano .env

# Compilar
npm run build

# Iniciar
npm run pm2:start
```

---

## 📁 ¿Qué Archivos Mover?

### ✅ SÍ Mover:
- `src/` - Código fuente
- `server/` - Código del servidor
- `package.json` - Dependencias
- `tsconfig*.json` - Configuración TypeScript
- `vite.config.ts` - Configuración Vite
- `ecosystem.config.js` - Configuración PM2
- `README.md` - Documentación

### ❌ NO Mover:
- `node_modules/` - Se instala con `npm install`
- `dist/` - Se genera con `npm run build`
- `.env` - Crear en el servidor
- `logs/` - Se crea automáticamente

---

## 🔧 Comandos Esenciales

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs radial-habit-tracker

# Reiniciar
pm2 restart radial-habit-tracker

# Detener
pm2 stop radial-habit-tracker

# Inicio automático (Linux)
pm2 save
pm2 startup
```

---

## 📍 Ubicaciones Comunes

### Windows
```
C:\apps\calendario\
C:\Users\usuario\apps\calendario\
```

### Linux
```
/home/usuario/apps/calendario/
/var/www/calendario/
/opt/calendario/
```

---

## ⚡ Script Rápido (Todo en Uno)

**Windows (PowerShell):**
```powershell
.\start-production.ps1
```

**Linux/Mac:**
```bash
chmod +x start-production.sh
./start-production.sh
```

Estos scripts hacen todo automáticamente:
- ✅ Verifican PM2
- ✅ Crean .env si no existe
- ✅ Compilan el proyecto
- ✅ Inician con PM2

---

## 🆘 ¿Problemas?

1. **"npm no encontrado"** → Instalar Node.js
2. **"pm2 no encontrado"** → `npm install -g pm2`
3. **"Puerto en uso"** → Cambiar `PORT` en `.env`
4. **"Permiso denegado"** → Ejecutar como administrador

---

## 📞 ¿Dónde ejecutar?

1. **Tu PC actual** → Para uso personal**
2. **Servidor VPS** → Para acceso remoto (DigitalOcean, etc.)
3. **Servidor en casa** → Raspberry Pi, PC con Linux
4. **Cloud** → Railway, Render (gratis)

**Recomendación:** Empieza en tu PC actual para probar, luego mueve a servidor si necesitas acceso remoto.

