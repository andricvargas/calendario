# Script para verificar que el servidor está corriendo
# Uso: .\verificar-servidor.ps1

Write-Host "🔍 Verificando estado del servidor..." -ForegroundColor Yellow
Write-Host ""

# Verificar puerto 3001
Write-Host "📌 Verificando puerto 3001 (servidor backend)..." -ForegroundColor Cyan
$port3001 = netstat -ano | findstr ":3001.*LISTENING"
if ($port3001) {
    Write-Host "✅ Puerto 3001 está en uso" -ForegroundColor Green
    Write-Host $port3001
} else {
    Write-Host "❌ Puerto 3001 NO está en uso - El servidor NO está corriendo" -ForegroundColor Red
}

Write-Host ""

# Verificar puerto 3000
Write-Host "📌 Verificando puerto 3000 (Vite frontend)..." -ForegroundColor Cyan
$port3000 = netstat -ano | findstr ":3000.*LISTENING"
if ($port3000) {
    Write-Host "✅ Puerto 3000 está en uso" -ForegroundColor Green
    Write-Host $port3000
} else {
    Write-Host "⚠️  Puerto 3000 NO está en uso" -ForegroundColor Yellow
}

Write-Host ""

# Probar conexión al servidor
Write-Host "🌐 Probando conexión al servidor..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Servidor responde correctamente" -ForegroundColor Green
    Write-Host "Respuesta: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ No se pudo conectar al servidor en http://localhost:3001" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Solución:" -ForegroundColor Cyan
    Write-Host "1. Asegúrate de que el servidor esté corriendo" -ForegroundColor White
    Write-Host "2. Ejecuta: npm run dev" -ForegroundColor White
    Write-Host "3. O verifica que PM2 esté corriendo: pm2 list" -ForegroundColor White
}

Write-Host ""

# Verificar PM2
Write-Host "📌 Verificando PM2..." -ForegroundColor Cyan
$pm2Check = pm2 list 2>$null
if ($pm2Check) {
    Write-Host "PM2 está instalado. Procesos:" -ForegroundColor Green
    pm2 list
} else {
    Write-Host "PM2 no está instalado o no hay procesos corriendo" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - Iniciar desarrollo: npm run dev" -ForegroundColor White
Write-Host "  - Ver procesos PM2: pm2 list" -ForegroundColor White
Write-Host "  - Detener PM2: pm2 stop all" -ForegroundColor White
Write-Host "  - Probar servidor: curl http://localhost:3001/api/test" -ForegroundColor White

