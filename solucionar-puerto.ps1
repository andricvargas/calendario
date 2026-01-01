# Script para solucionar problemas de puerto en Windows
# Uso: .\solucionar-puerto.ps1

Write-Host "🔍 Buscando procesos usando los puertos 3000 y 3001..." -ForegroundColor Yellow

# Buscar procesos en puerto 3000
Write-Host "`n📌 Puerto 3000:" -ForegroundColor Cyan
$port3000 = netstat -ano | findstr ":3000"
if ($port3000) {
    Write-Host $port3000 -ForegroundColor Red
    $pid3000 = ($port3000 | Select-String -Pattern "LISTENING\s+(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    if ($pid3000) {
        Write-Host "PID encontrado: $pid3000" -ForegroundColor Yellow
        $process = Get-Process -Id $pid3000 -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Proceso: $($process.ProcessName) (PID: $pid3000)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✅ Puerto 3000 libre" -ForegroundColor Green
}

# Buscar procesos en puerto 3001
Write-Host "`n📌 Puerto 3001:" -ForegroundColor Cyan
$port3001 = netstat -ano | findstr ":3001"
if ($port3001) {
    Write-Host $port3001 -ForegroundColor Red
    $pid3001 = ($port3001 | Select-String -Pattern "LISTENING\s+(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    if ($pid3001) {
        Write-Host "PID encontrado: $pid3001" -ForegroundColor Yellow
        $process = Get-Process -Id $pid3001 -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Proceso: $($process.ProcessName) (PID: $pid3001)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✅ Puerto 3001 libre" -ForegroundColor Green
}

# Verificar PM2
Write-Host "`n📌 Verificando PM2..." -ForegroundColor Cyan
$pm2Processes = pm2 list 2>$null
if ($pm2Processes) {
    Write-Host "PM2 está corriendo:" -ForegroundColor Yellow
    pm2 list
    Write-Host "`n💡 Para detener PM2, ejecuta: pm2 stop all" -ForegroundColor Cyan
    Write-Host "💡 O: pm2 delete all" -ForegroundColor Cyan
} else {
    Write-Host "✅ PM2 no está corriendo" -ForegroundColor Green
}

Write-Host "`n🔧 Soluciones:" -ForegroundColor Cyan
Write-Host "1. Detener PM2: pm2 stop all" -ForegroundColor White
Write-Host "2. Matar proceso específico: taskkill /PID <numero> /F" -ForegroundColor White
Write-Host "3. Reiniciar la aplicación después" -ForegroundColor White

