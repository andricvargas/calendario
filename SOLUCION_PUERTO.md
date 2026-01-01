# 🔧 Solución: Puerto en Uso

## Problema
```
Error: listen EADDRINUSE: address already in use :::3001
```

El puerto 3001 está siendo usado por otro proceso (probablemente PM2 o una instancia anterior).

## ✅ Solución Rápida

### Paso 1: Detener PM2 (si está corriendo)

```powershell
# Ver qué está corriendo
pm2 list

# Detener todo
pm2 stop all

# O eliminar todo
pm2 delete all
```

### Paso 2: Buscar y Matar el Proceso

```powershell
# Ver qué está usando el puerto 3001
netstat -ano | findstr :3001

# Verás algo como:
# TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
# El último número es el PID

# Matar el proceso (reemplaza 12345 con el PID que veas)
taskkill /PID 12345 /F
```

### Paso 3: Usar el Script Automático

```powershell
.\solucionar-puerto.ps1
```

Este script te mostrará qué está usando los puertos y cómo solucionarlo.

## 🔄 Solución Alternativa: Cambiar Puertos

Si no puedes detener el proceso, cambia los puertos:

### Opción 1: Cambiar puerto del servidor

Crea o edita `.env`:
```env
PORT=3002
```

Y actualiza `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3002',  // Cambiar aquí
    ...
  }
}
```

### Opción 2: Cambiar puerto de Vite

En `vite.config.ts`:
```typescript
server: {
  port: 3002,  // Cambiar aquí
  ...
}
```

## 🚀 Reiniciar Después de Solucionar

```powershell
# Limpiar y reiniciar
npm run dev
```

## 📋 Checklist

- [ ] Verificar PM2: `pm2 list`
- [ ] Detener PM2 si está corriendo: `pm2 stop all`
- [ ] Verificar puertos: `netstat -ano | findstr :3001`
- [ ] Matar proceso si es necesario: `taskkill /PID <numero> /F`
- [ ] Reiniciar: `npm run dev`

