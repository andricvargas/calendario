# Script de inicio para producción en Windows
# Uso: .\start-production.ps1

Write-Host "🚀 Iniciando Radial Habit Tracker en producción..." -ForegroundColor Green

# Verificar que PM2 esté instalado
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "❌ PM2 no está instalado. Instalando..." -ForegroundColor Yellow
    npm install -g pm2
}

# Verificar que existe el archivo .env
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Archivo .env no encontrado. Creando desde .env.example..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "✅ Archivo .env creado. Por favor, edítalo y configura los valores necesarios." -ForegroundColor Yellow
        Write-Host "   Presiona Enter cuando hayas terminado..."
        Read-Host
    } else {
        Write-Host "❌ Error: No se encontró .env.example" -ForegroundColor Red
        exit 1
    }
}

# Verificar que el proyecto esté compilado
if (-not (Test-Path dist)) {
    Write-Host "📦 Compilando proyecto..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al compilar el proyecto" -ForegroundColor Red
        exit 1
    }
}

# Crear directorio de logs si no existe
if (-not (Test-Path logs)) {
    New-Item -ItemType Directory -Path logs | Out-Null
    Write-Host "✅ Directorio logs/ creado" -ForegroundColor Green
}

# Verificar si la aplicación ya está corriendo
$pm2Status = pm2 list | Select-String "radial-habit-tracker"
if ($pm2Status) {
    Write-Host "⚠️  La aplicación ya está corriendo. Reiniciando..." -ForegroundColor Yellow
    pm2 restart radial-habit-tracker
} else {
    Write-Host "🚀 Iniciando aplicación con PM2..." -ForegroundColor Green
    pm2 start ecosystem.config.js
}

Write-Host ""
Write-Host "✅ Aplicación iniciada!" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - Ver logs: pm2 logs radial-habit-tracker" -ForegroundColor White
Write-Host "  - Ver estado: pm2 status" -ForegroundColor White
Write-Host "  - Detener: pm2 stop radial-habit-tracker" -ForegroundColor White
Write-Host "  - Reiniciar: pm2 restart radial-habit-tracker" -ForegroundColor White
Write-Host ""

