# Ejemplo Inngest - Material Educativo

Material educativo sobre jobs y colas de trabajo usando Inngest para alumnos de 2º DAM.

## Setup Rápido

### 1. Crear tu Bot de Telegram

1. Abre Telegram y busca `@BotFather`
2. Envía `/newbot`
3. Sigue las instrucciones (nombre y username del bot)
4. Copia el token que proporciona BotFather
5. Inicia un chat con tu bot (búscalo por el username que creaste)

### 2. Obtener tu Chat ID

Después de configurar el proyecto (pasos 3-5), ejecuta:

```bash
# Con el servidor corriendo, visita:
http://localhost:3000/api/obtener-chat-id
```

Envía un mensaje a tu bot y recarga la página. Verás tu Chat ID.

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Variables de Entorno

```bash
cp .env.example .env
# Edita .env y añade tu TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Esto iniciará:
- API Express en `http://localhost:3000`
- Inngest Dev Server en `http://localhost:8288` (UI para ver jobs)

## Endpoints Disponibles

### Información
- `GET /` - Información de la API
- `GET /health` - Health check
- `GET /api/obtener-chat-id` - Helper para obtener Chat ID

### Ejemplos Inngest
- `POST /api/notificar` - Ejemplo básico (envío simple)
- `POST /api/procesar-pedido` - Ejemplo con retry automático
- `POST /api/usuario-nuevo` - Workflow multi-paso
- Cron automático cada 2 horas (ver en Inngest Dev Server)

## Documentación

Ver `docs/guia-jobs-y-colas.md` para teoría completa sobre jobs y colas de trabajo.

## Testing

```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Modo watch
```

## Ejemplos de Uso

### 1. Notificación Básica

```bash
curl -X POST http://localhost:3000/api/notificar \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Hola desde Inngest"}'
```

### 2. Procesar Pedido (con retry)

```bash
curl -X POST http://localhost:3000/api/procesar-pedido \
  -H "Content-Type: application/json" \
  -d '{
    "pedidoId": "PED-12345",
    "items": ["Laptop", "Mouse", "Teclado"]
  }'
```

**Nota**: Este endpoint simula fallos aleatorios (70% falla). Observa en el Inngest Dev Server cómo reintenta automáticamente.

### 3. Workflow de Onboarding

```bash
curl -X POST http://localhost:3000/api/usuario-nuevo \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  }'
```

Recibirás 3 mensajes en Telegram con delays de 10 segundos entre cada uno.

### 4. Reporte Periódico (Cron)

No requiere llamada manual. Se ejecuta automáticamente cada 2 horas. Puedes verlo en el Inngest Dev Server y también triggerarlo manualmente desde allí.

## Estructura del Proyecto

```
ejemplo-inngest/
├── src/
│   ├── index.js                    # API Express principal
│   ├── inngest/
│   │   ├── client.js               # Cliente Inngest
│   │   └── functions/
│   │       ├── 1-basico.js        # Ejemplo 1: Notificación básica
│   │       ├── 2-retry.js         # Ejemplo 2: Retry automático
│   │       ├── 3-cron.js          # Ejemplo 3: Tarea programada
│   │       └── 4-workflow.js      # Ejemplo 4: Workflow multi-paso
│   └── utils/
│       └── telegram.js             # Helper para Telegram Bot API
├── tests/
│   └── functions.test.js           # Tests de las funciones
├── docs/
│   ├── guia-jobs-y-colas.md       # Guía teórica completa
│   └── plans/                      # Planes de diseño e implementación
├── .env.example                    # Template de variables
├── jest.config.js                  # Configuración de Jest
└── package.json
```

## Troubleshooting

### El bot no envía mensajes

1. Verifica que `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` estén en `.env`
2. Asegúrate de haber iniciado un chat con tu bot
3. Revisa los logs de la consola para ver errores

### No veo jobs en Inngest Dev Server

1. Verifica que `http://localhost:8288` esté abierto
2. Asegúrate de que `npm run dev` esté corriendo
3. Recarga la página después de enviar un evento

### Los tests fallan

1. Verifica que las dependencias estén instaladas: `npm install`
2. Asegúrate de estar usando Node.js 18 o superior
3. Ejecuta `npm test -- --verbose` para ver más detalles

## Licencia

MIT
