#!/bin/bash
# Script de inicio para producción en Linux/Mac
# Uso: ./start-production.sh

echo "🚀 Iniciando Radial Habit Tracker en producción..."

# Verificar que PM2 esté instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado. Instalando..."
    npm install -g pm2
fi

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Creando desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado. Por favor, edítalo y configura los valores necesarios."
        echo "   Presiona Enter cuando hayas terminado..."
        read
    else
        echo "❌ Error: No se encontró .env.example"
        exit 1
    fi
fi

# Verificar que el proyecto esté compilado
if [ ! -d dist ]; then
    echo "📦 Compilando proyecto..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Error al compilar el proyecto"
        exit 1
    fi
fi

# Crear directorio de logs si no existe
if [ ! -d logs ]; then
    mkdir -p logs
    echo "✅ Directorio logs/ creado"
fi

# Verificar si la aplicación ya está corriendo
if pm2 list | grep -q "radial-habit-tracker"; then
    echo "⚠️  La aplicación ya está corriendo. Reiniciando..."
    pm2 restart radial-habit-tracker
else
    echo "🚀 Iniciando aplicación con PM2..."
    pm2 start ecosystem.config.js
fi

echo ""
echo "✅ Aplicación iniciada!"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs: pm2 logs radial-habit-tracker"
echo "  - Ver estado: pm2 status"
echo "  - Detener: pm2 stop radial-habit-tracker"
echo "  - Reiniciar: pm2 restart radial-habit-tracker"
echo ""

