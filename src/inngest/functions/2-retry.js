import { inngest } from '../client.js';
import { enviarMensajeTelegram } from '../../utils/telegram.js';

/**
 * Ejemplo 2: Retry Automático
 *
 * Demuestra:
 * - Reintentos automáticos ante fallos
 * - Configuración de número de intentos
 * - Simulación de fallos aleatorios
 */
export const procesarPedido = inngest.createFunction(
  {
    id: 'procesar-pedido',
    retries: 5  // Configurar 5 reintentos
  },
  { event: 'pedido/procesar' },
  async ({ event, step }) => {
    // Step 1: Simular procesamiento que puede fallar
    const resultado = await step.run('procesar-pago', async () => {
      // Simular fallo aleatorio (70% falla, 30% éxito)
      const exito = Math.random() > 0.7;

      if (!exito) {
        throw new Error('Error simulado en procesamiento de pago');
      }

      return {
        pedidoId: event.data.pedidoId,
        estado: 'procesado',
        timestamp: new Date().toISOString()
      };
    });

    // Step 2: Enviar confirmación por Telegram
    await step.run('enviar-confirmacion', async () => {
      const mensaje = `✅ *Pedido Procesado*\n\n` +
        `ID: ${resultado.pedidoId}\n` +
        `Items: ${event.data.items.join(', ')}\n` +
        `Estado: ${resultado.estado}\n` +
        `Fecha: ${new Date(resultado.timestamp).toLocaleString('es-ES')}`;

      return await enviarMensajeTelegram(mensaje);
    });

    return resultado;
  }
);
