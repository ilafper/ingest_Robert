# Guía: Jobs y Colas de Trabajo

Material educativo para 2º DAM - Desarrollo de Aplicaciones Multiplataforma

---

## Parte 1: Conceptos Básicos

### ¿Qué son los Jobs y las Colas de Trabajo?

Un **job** (trabajo) es una tarea que se ejecuta de forma asíncrona, es decir, independiente de la petición HTTP que la originó.

Una **cola de trabajo** (job queue) es un sistema que gestiona la ejecución de estos jobs de forma ordenada y confiable.

#### Ejemplo Real

Imagina una aplicación de comercio electrónico:

```
Usuario hace pedido → Respuesta inmediata "Pedido recibido"
                  ↓
            (En segundo plano)
        ┌────────────────────────┐
        │ • Procesar pago        │
        │ • Actualizar inventario│
        │ • Enviar email         │
        │ • Notificar almacén    │
        └────────────────────────┘
```

### Síncrono vs Asíncrono

#### Petición Síncrona (tradicional)

```javascript
app.post('/pedido', async (req, res) => {
  const pedido = crearPedido(req.body);
  await procesarPago(pedido);        // El usuario espera
  await actualizarInventario(pedido); // El usuario sigue esperando
  await enviarEmail(pedido);          // El usuario aún espera
  await notificarAlmacen(pedido);     // El usuario todavía espera

  res.json({ mensaje: 'Pedido completado' }); // Respuesta tras 10+ segundos
});
```

**Problemas:**
- Usuario espera mucho tiempo
- Si falla algo a mitad, ¿qué hacemos?
- Si hay pico de tráfico, servidor se sobrecarga

#### Petición Asíncrona (con jobs)

```javascript
app.post('/pedido', async (req, res) => {
  const pedido = crearPedido(req.body);

  // Enviar a cola de trabajo
  await enviarJob('procesar-pedido', { pedidoId: pedido.id });

  res.json({ mensaje: 'Pedido recibido' }); // Respuesta inmediata
});

// En segundo plano (job worker)
jobs.on('procesar-pedido', async ({ pedidoId }) => {
  await procesarPago(pedidoId);
  await actualizarInventario(pedidoId);
  await enviarEmail(pedidoId);
  await notificarAlmacen(pedidoId);
});
```

**Ventajas:**
- Respuesta inmediata al usuario
- Procesamiento en segundo plano
- Mayor resiliencia ante fallos
- Mejor escalabilidad

### ¿Cuándo Usar Jobs?

| Usar Jobs | No Usar Jobs |
|-----------|--------------|
| Enviar emails | Consultar datos simples |
| Procesar imágenes/videos | Autenticación |
| Generar reportes | Operaciones de lectura rápidas |
| Llamadas a APIs externas lentas | Validaciones síncronas |
| Tareas programadas (cron) | Respuestas que el usuario necesita inmediatamente |
| Procesamiento batch | - |

### Casos de Uso Reales

1. **E-commerce**: Procesar pagos, enviar confirmaciones, actualizar inventario
2. **Redes Sociales**: Procesar imágenes subidas, generar thumbnails, enviar notificaciones
3. **Aplicaciones SaaS**: Generar reportes, exportar datos, sincronizar con servicios externos
4. **Sistemas de Notificaciones**: Enviar emails masivos, push notifications

---

## Parte 2: Patrones Avanzados

### Patrón 1: Retry (Reintentos)

Cuando una tarea falla temporalmente (API caída, timeout de red), queremos reintentarla automáticamente.

```javascript
// Sin retry
async function enviarEmail(destinatario) {
  const resultado = await api.enviarEmail(destinatario);
  // Si falla → Error y se pierde
}

// Con retry
jobs.createJob({
  id: 'enviar-email',
  retries: 5,  // Reintentar hasta 5 veces
  backoff: {
    type: 'exponential',  // Esperar más tiempo entre intentos
    delay: 1000           // 1s, 2s, 4s, 8s, 16s
  }
}, async ({ destinatario }) => {
  return await api.enviarEmail(destinatario);
});
```

**¿Cuándo usar retry?**
- Llamadas a APIs externas (pueden fallar temporalmente)
- Procesamiento de archivos (puede haber bloqueos temporales)
- Operaciones de base de datos (puede haber locks)

**¿Cuándo NO usar retry?**
- Errores de validación (reintentarlo no lo arreglará)
- Datos incorrectos
- Errores de lógica de negocio

### Patrón 2: Scheduling (Tareas Programadas)

Ejecutar tareas en momentos específicos o de forma periódica.

```javascript
// Ejecutar cada día a las 9:00 AM
jobs.createScheduledJob({
  id: 'reporte-diario',
  cron: '0 9 * * *',  // Formato cron
}, async () => {
  const reporte = await generarReporteDiario();
  await enviarEmailReporte(reporte);
});

// Ejecutar cada hora
jobs.createScheduledJob({
  id: 'limpieza-cache',
  cron: '0 * * * *',
}, async () => {
  await limpiarCacheExpirado();
});
```

**Formato Cron:**
```
┌─────── minuto (0 - 59)
│ ┌───── hora (0 - 23)
│ │ ┌─── día del mes (1 - 31)
│ │ │ ┌─ mes (1 - 12)
│ │ │ │ ┌ día de la semana (0 - 6) (Domingo = 0)
│ │ │ │ │
* * * * *
```

Ejemplos:
- `0 9 * * *` - Cada día a las 9:00 AM
- `0 */2 * * *` - Cada 2 horas
- `0 0 * * 0` - Cada domingo a medianoche
- `30 14 1 * *` - Día 1 de cada mes a las 14:30

### Patrón 3: Delays (Pausas)

Esperar un tiempo específico antes de continuar.

```javascript
jobs.createJob({
  id: 'recordatorio-carrito',
}, async ({ usuarioId, carritoId }) => {
  // Esperar 1 hora
  await delay('1h');

  // Verificar si el carrito sigue abandonado
  const carrito = await obtenerCarrito(carritoId);
  if (carrito.estado === 'abandonado') {
    await enviarEmailRecordatorio(usuarioId);
  }
});
```

**Casos de uso:**
- Recordatorios de carritos abandonados
- Follow-ups de onboarding
- Escalamiento de tickets de soporte

### Patrón 4: Workflows (Flujos Multi-Paso)

Encadenar múltiples tareas en un flujo secuencial.

```javascript
jobs.createJob({
  id: 'onboarding-usuario',
}, async ({ usuarioId }) => {
  // Paso 1: Email de bienvenida
  await enviarEmailBienvenida(usuarioId);

  // Paso 2: Esperar 1 día
  await delay('1d');

  // Paso 3: Email con tips
  await enviarEmailTips(usuarioId);

  // Paso 4: Esperar 3 días
  await delay('3d');

  // Paso 5: Pedir feedback
  await enviarEmailFeedback(usuarioId);
});
```

**Ventajas:**
- Cada paso se puede reintentar independientemente
- El estado persiste entre pasos
- Fácil de visualizar y debuggear

### Patrón 5: Fan-out / Fan-in

**Fan-out**: Un job dispara múltiples jobs en paralelo

```javascript
jobs.createJob({
  id: 'procesar-pedido-masivo',
}, async ({ pedidos }) => {
  // Disparar un job por cada pedido (en paralelo)
  await Promise.all(
    pedidos.map(pedido =>
      enviarJob('procesar-pedido-individual', { pedido })
    )
  );
});
```

**Fan-in**: Múltiples jobs completan y se agrega resultado

```javascript
jobs.createJob({
  id: 'generar-reporte-completo',
}, async () => {
  // Generar reportes parciales en paralelo
  const [ventasReporte, usuariosReporte, inventarioReporte] = await Promise.all([
    generarReporteVentas(),
    generarReporteUsuarios(),
    generarReporteInventario()
  ]);

  // Combinar todos los reportes
  return combinarReportes([ventasReporte, usuariosReporte, inventarioReporte]);
});
```

---

## Parte 3: Introducción a Inngest

### ¿Qué es Inngest?

Inngest es una plataforma moderna para ejecutar jobs y workflows de forma confiable. Se diferencia de otras soluciones porque:

1. **Serverless-first**: No necesitas gestionar infraestructura de colas
2. **Type-safe**: Soporte completo de TypeScript
3. **Observabilidad integrada**: UI visual para ver y debuggear jobs
4. **Durable execution**: Los pasos se memorizan, no se repiten si falla algo después

### Conceptos Clave

#### 1. Eventos

Todo en Inngest comienza con un **evento**:

```javascript
await inngest.send({
  name: 'usuario/registro',
  data: {
    userId: '123',
    email: 'usuario@example.com'
  }
});
```

#### 2. Funciones

Las **funciones** escuchan eventos y ejecutan lógica:

```javascript
inngest.createFunction(
  { id: 'enviar-bienvenida' },
  { event: 'usuario/registro' },
  async ({ event }) => {
    await enviarEmail(event.data.email);
  }
);
```

#### 3. Steps

Los **steps** son bloques de trabajo que se memorizan:

```javascript
inngest.createFunction(
  { id: 'procesar-pedido' },
  { event: 'pedido/creado' },
  async ({ event, step }) => {
    // Step 1 - Si esto falla, solo se reintenta este step
    const pago = await step.run('procesar-pago', async () => {
      return await stripe.charge(event.data.total);
    });

    // Step 2 - Si llega aquí, el step 1 ya está completo
    await step.run('actualizar-inventario', async () => {
      return await db.actualizarStock(event.data.items);
    });
  }
);
```

### Inngest Dev Server

Inngest incluye un servidor de desarrollo con UI visual:

```bash
npm run dev  # Inicia el dev server automáticamente
```

Abre `http://localhost:8288` para ver:
- ✅ Funciones registradas
- 📊 Jobs en ejecución
- ⏱️ Historial de ejecuciones
- 🐛 Logs y errores
- ⚡ Trigger manual de funciones

### Ventajas vs Otras Soluciones

| Feature | Inngest | Bull/BeeQueue | AWS SQS + Lambda |
|---------|---------|---------------|------------------|
| **Setup** | Mínimo | Redis requerido | Configuración compleja |
| **Observabilidad** | UI integrada | Requiere Bull Board | CloudWatch |
| **Retry** | Automático por step | Manual | Manual |
| **Scheduling** | Cron nativo | Requiere bull-cron | EventBridge |
| **Type Safety** | ✅ TypeScript | ⚠️ Limitado | ⚠️ Limitado |
| **Local Dev** | Dev server | ✅ Redis local | ❌ Mock complejo |
| **Costo** | Free tier generoso | Redis hosting | Pay per request |

---

## Parte 4: Ejemplos Prácticos

En este repositorio encontrarás 4 ejemplos progresivos que demuestran los conceptos explicados:

### Ejemplo 1: Notificación Básica

```
Usuario → POST /api/notificar → Evento → Función → Telegram
```

**Conceptos**: Evento, Función, Step básico

**Código**: `src/inngest/functions/1-basico.js`

### Ejemplo 2: Procesamiento con Retry

```
Usuario → POST /api/procesar-pedido → Evento → Función (con retry) → Telegram
                                                    ↓ (falla 70%)
                                                Reintento automático
```

**Conceptos**: Retry automático, configuración de reintentos

**Código**: `src/inngest/functions/2-retry.js`

### Ejemplo 3: Tarea Programada

```
Cron (cada 2h) → Función → Generar reporte → Telegram
```

**Conceptos**: Cron scheduling, ejecución periódica

**Código**: `src/inngest/functions/3-cron.js`

### Ejemplo 4: Workflow Multi-Paso

```
Usuario → POST /api/usuario-nuevo → Evento → Workflow:
                                               ├─ Bienvenida → Telegram
                                               ├─ Espera 10s
                                               ├─ Recordatorio → Telegram
                                               ├─ Espera 10s
                                               └─ Tips → Telegram
```

**Conceptos**: Workflows, step.sleep, estado persistente

**Código**: `src/inngest/functions/4-workflow.js`

### Diagrama de Flujo General

```
┌─────────────┐
│   Cliente   │
│   (Postman) │
└──────┬──────┘
       │ HTTP POST
       ▼
┌─────────────────┐
│  API Express    │
│  (src/index.js) │
└──────┬──────────┘
       │ inngest.send()
       ▼
┌──────────────────┐
│  Inngest Events  │
└──────┬───────────┘
       │
       ▼
┌────────────────────────┐
│  Inngest Functions     │
│  (src/inngest/...)     │
└──────┬─────────────────┘
       │ step.run()
       ▼
┌────────────────────────┐
│  Telegram Bot API      │
│  (utils/telegram.js)   │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│  Usuario ve mensaje    │
│  en Telegram           │
└────────────────────────┘
```

### Próximos Pasos

1. ✅ Lee esta guía completa
2. ✅ Configura tu Bot de Telegram siguiendo el README
3. ✅ Ejecuta `npm run dev` y abre http://localhost:8288
4. ✅ Prueba cada endpoint con Postman o curl
5. ✅ Observa los jobs en el Inngest Dev Server
6. ✅ Revisa el código de cada función para entender cómo funciona
7. ✅ Ejecuta los tests con `npm test`

### Recursos Adicionales

- [Documentación Oficial de Inngest](https://www.inngest.com/docs)
- [Crontab Guru](https://crontab.guru) - Generador de expresiones cron
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**¡Ahora estás listo para trabajar con jobs y colas de trabajo profesionalmente!** 🚀
