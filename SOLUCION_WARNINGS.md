# Solución de Warnings

## Warning: NODE_ENV=production en .env

**Mensaje:**
```
NODE_ENV=production is not supported in the .env file. Only NODE_ENV=development is supported to create a development build of your project.
```

### Solución

Para desarrollo, edita tu archivo `.env` y cambia:

```env
# ❌ Incorrecto para desarrollo
NODE_ENV=production

# ✅ Correcto para desarrollo
NODE_ENV=development
```

O simplemente elimina la línea `NODE_ENV` del `.env` cuando estés en desarrollo, ya que Vite automáticamente usa `development` en modo dev.

### Cuándo usar cada uno

- **Desarrollo (`npm run dev`)**: `NODE_ENV=development` o no incluir la variable
- **Producción (`npm run build` + `npm start`)**: `NODE_ENV=production`

---

## Warning: util._extend deprecado

**Mensaje:**
```
(node:9404) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
```

### Explicación

Este warning viene de una dependencia antigua (probablemente `concurrently` o alguna de sus dependencias) que usa la API `util._extend` que está deprecada en Node.js. 

**No es crítico** - No afecta la funcionalidad de la aplicación, solo es una advertencia de que la dependencia usa código antiguo.

### Soluciones

#### Opción 1: Ignorar (Recomendado)
Este warning es inofensivo y no afecta el funcionamiento. Puedes ignorarlo sin problemas.

#### Opción 2: Actualizar dependencias
```bash
# Actualizar todas las dependencias
npm update

# O actualizar específicamente concurrently
npm install concurrently@latest
```

#### Opción 3: Suprimir el warning (No recomendado)
Si realmente te molesta, puedes suprimir warnings de deprecación:
```bash
# En package.json, cambiar el script dev:
"dev": "NODE_NO_WARNINGS=1 concurrently \"npm run dev:server\" \"npm run dev:client\""

# En Windows PowerShell:
$env:NODE_NO_WARNINGS=1; npm run dev
```

**Nota:** Suprimir warnings no es recomendado porque pueden ocultar problemas reales en el futuro.

---

## Estado Actual

✅ **Servidor backend**: Corriendo en http://localhost:3001
✅ **Frontend Vite**: Corriendo en http://localhost:3000
✅ **Todo funcionando correctamente**

Ahora puedes:
1. Abrir http://localhost:3000 en tu navegador
2. Intentar hacer login con tu código TOTP
3. El timeout debería estar resuelto ahora que el servidor está corriendo

