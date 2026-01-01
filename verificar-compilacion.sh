#!/bin/bash

echo "=== Verificando compilación del servidor ==="
echo ""

echo "1. Verificando estructura de dist/"
ls -la dist/ 2>/dev/null || echo "dist/ no existe"
echo ""

echo "2. Buscando archivos .js en dist/"
find dist -name "*.js" -type f 2>/dev/null || echo "No se encontraron archivos .js"
echo ""

echo "3. Verificando si server/index.ts existe"
ls -la server/index.ts 2>/dev/null || echo "server/index.ts no existe"
echo ""

echo "4. Intentando compilar..."
npm run build:server
echo ""

echo "5. Verificando si se generó dist/server/index.js"
ls -la dist/server/index.js 2>/dev/null || echo "dist/server/index.js NO EXISTE"
echo ""

echo "6. Estructura completa de dist/"
find dist -type f 2>/dev/null | head -20

