# Radial Habit Tracker

Aplicación web full-stack para tracking de hábitos con visualización radial, implementada con Clean Architecture y protegida por autenticación TOTP (2FA).

## Características

- **Arquitectura Limpia**: Separación en capas (Domain, Application, Infrastructure, Presentation)
- **Autenticación 2FA**: Protección mediante TOTP (Google Authenticator)
- **Visualización Radial**: Gráfico circular con D3.js mostrando 31 días y 8 hábitos
- **Persistencia CSV**: Datos almacenados en archivo CSV protegido en el servidor
- **Edición Inteligente**: Solo el día actual es editable por defecto
- **Diseño Moderno**: UI responsive con animaciones suaves

## Estructura del Proyecto

```
calendario/
├── src/
│   ├── domain/              # Entidades y lógica de negocio
│   ├── application/         # Casos de uso
│   ├── infrastructure/      # Adaptadores (CSV, Tiempo, TOTP)
│   └── presentation/        # Componentes React
├── server/                  # Backend Express
│   ├── routes/              # Rutas API
│   ├── middleware/         # Middleware de autenticación
│   └── progress.csv         # Archivo de datos (protegido)
└── package.json
```

## Requisitos

- Node.js 18+ 
- npm o yarn

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (opcional):
```bash
cp .env.example .env
```

Editar `.env` y configurar:
- `TOTP_SECRET_SEED`: Secret para TOTP (por defecto: JBSWY3DPEHPK3PXP)
- `SESSION_SECRET`: Secret para sesiones (cambiar en producción)

## Configuración de Google Authenticator

1. Instalar Google Authenticator en tu dispositivo móvil
2. Agregar una cuenta manualmente
3. Usar el secret: `JBSWY3DPEHPK3PXP` (o el configurado en `.env`)
4. Tipo: Time-based (TOTP)
5. El código de 6 dígitos generado es el que usarás para autenticarte

## Ejecución

### Desarrollo

Ejecutar cliente y servidor simultáneamente:
```bash
npm run dev
```

O por separado:
```bash
# Terminal 1: Servidor (puerto 3001)
npm run dev:server

# Terminal 2: Cliente (puerto 3000)
npm run dev:client
```

### Producción

#### Opción 1: Con PM2 (Recomendado)

```bash
# 1. Instalar PM2 globalmente
npm install -g pm2

# 2. Configurar variables de entorno
# Crear archivo .env con las variables necesarias (ver DEPLOY.md)

# 3. Compilar proyecto
npm run build

# 4. Iniciar con PM2
npm run pm2:start

# O usar el script automatizado:
# Linux/Mac: ./start-production.sh
# Windows: .\start-production.ps1
```

#### Opción 2: Sin PM2

```bash
# Build
npm run build

# Ejecutar
npm start
```

**Nota:** Para mantener el servicio activo y reiniciarlo automáticamente, se recomienda usar PM2. Ver [DEPLOY.md](./DEPLOY.md) para más detalles.

## Uso

1. Acceder a `http://localhost:3000`
2. Ingresar el código de 6 dígitos de Google Authenticator
3. Una vez autenticado, verás el gráfico radial del mes actual
4. El día actual está resaltado con un borde azul
5. Click en el día actual para editarlo
6. Marcar/desmarcar hábitos en el panel lateral
7. Los cambios se guardan automáticamente en el CSV del servidor

## Estructura del CSV

El archivo `server/progress.csv` tiene el siguiente formato:

```csv
fecha,habito_1,habito_2,habito_3,habito_4,habito_5,habito_6,habito_7,habito_8
2024-01-01,1,0,1,1,0,1,0,1
2024-01-02,1,1,1,1,1,1,1,1
```

- `fecha`: Fecha en formato YYYY-MM-DD
- `habito_X`: 1 = completado, 0 = no completado

## API Endpoints

### Autenticación

- `POST /api/auth/validate-totp` - Validar código TOTP
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/status` - Estado de autenticación

### Progreso (requiere autenticación)

- `GET /api/progress?year=2024&month=0` - Obtener progreso del mes
- `POST /api/progress` - Guardar/actualizar hábito
- `GET /api/progress/csv` - Descargar CSV completo

## Tecnologías

- **Frontend**: React 18, TypeScript, Vite, D3.js
- **Backend**: Express, Node.js
- **Autenticación**: otplib (TOTP)
- **CSV**: PapaParse
- **Arquitectura**: Clean Architecture, SOLID principles

## Seguridad

- Autenticación TOTP en servidor
- Sesiones con cookies httpOnly
- Archivo CSV protegido por middleware de autenticación
- Validación de datos en todas las capas

## Licencia

MIT

