import 'dotenv/config';
import express from 'express';
import { serve } from 'inngest/express';
import { inngest } from './inngest/client.js';
import { notificacionBasica } from './inngest/functions/1-basico.js';
import { procesarPedido } from './inngest/functions/2-retry.js';
import { reportePeriodico } from './inngest/functions/3-cron.js';
import { onboardingUsuario } from './inngest/functions/4-workflow.js';
import { obtenerActualizaciones } from './utils/telegram.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de información
app.get('/', (req, res) => {
  res.json({
    nombre: 'API Ejemplo Inngest',
    descripcion: 'Material educativo sobre jobs y colas de trabajo',
    endpoints: {
      info: 'GET /',
      health: 'GET /health',
      chatId: 'GET /api/obtener-chat-id',
      notificar: 'POST /api/notificar',
      procesarPedido: 'POST /api/procesar-pedido',
      usuarioNuevo: 'POST /api/usuario-nuevo'
    },
    inngestDevServer: 'http://localhost:8288'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper para obtener Chat ID
app.get('/api/obtener-chat-id', async (req, res) => {
  try {
    const updates = await obtenerActualizaciones();

    if (!updates.result || updates.result.length === 0) {
      return res.json({
        mensaje: 'No hay mensajes. Envía un mensaje a tu bot primero.',
        instrucciones: [
          '1. Busca tu bot en Telegram',
          '2. Envía cualquier mensaje',
          '3. Recarga esta página'
        ]
      });
    }

    const chatIds = updates.result.map(update => ({
      chatId: update.message?.chat?.id,
      nombre: update.message?.chat?.first_name,
      username: update.message?.chat?.username,
      mensaje: update.message?.text
    }));

    res.json({
      mensaje: 'Chat IDs encontrados',
      datos: chatIds,
      instrucciones: 'Copia el chatId y añádelo a tu archivo .env como TELEGRAM_CHAT_ID'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo actualizaciones',
      detalle: error.message
    });
  }
});

// Endpoint 1: Notificación básica
app.post('/api/notificar', async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ error: 'El campo "mensaje" es requerido' });
  }

  await inngest.send({
    name: 'notificacion/enviar',
    data: { mensaje }
  });

  res.json({
    mensaje: 'Evento enviado a Inngest',
    evento: 'notificacion/enviar'
  });
});

// Endpoint 2: Procesar pedido (con retry)
app.post('/api/procesar-pedido', async (req, res) => {
  const { pedidoId, items } = req.body;

  if (!pedidoId || !items) {
    return res.status(400).json({
      error: 'Los campos "pedidoId" e "items" son requeridos'
    });
  }

  await inngest.send({
    name: 'pedido/procesar',
    data: { pedidoId, items }
  });

  res.json({
    mensaje: 'Pedido enviado a procesamiento',
    evento: 'pedido/procesar',
    pedidoId
  });
});

// Endpoint 3: Usuario nuevo (workflow)
app.post('/api/usuario-nuevo', async (req, res) => {
  const { nombre, email } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({
      error: 'Los campos "nombre" y "email" son requeridos'
    });
  }

  await inngest.send({
    name: 'usuario/registro',
    data: { nombre, email }
  });

  res.json({
    mensaje: 'Workflow de onboarding iniciado',
    evento: 'usuario/registro',
    usuario: nombre
  });
});

// Servir funciones Inngest
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions: [
      notificacionBasica,
      procesarPedido,
      reportePeriodico,
      onboardingUsuario
    ]
  })
);

app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
  console.log(`📊 Inngest Dev Server: http://localhost:8288`);
  console.log(`\n💡 Endpoints disponibles:`);
  console.log(`   GET  /`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/obtener-chat-id`);
  console.log(`   POST /api/notificar`);
  console.log(`   POST /api/procesar-pedido`);
  console.log(`   POST /api/usuario-nuevo`);
});
