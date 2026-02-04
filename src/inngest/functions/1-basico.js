import { inngest } from '../client.js';
import { enviarMensajeTelegram } from '../../utils/telegram.js';

/**
 * Ejemplo 1: Notificación Básica
 *
 * Demuestra:
 * - Evento → Función → Step básico
 * - Uso de step.run para operaciones asíncronas
 * - Envío de mensaje a Telegram
 */
export const notificacionBasica = inngest.createFunction(
  { id: 'notificacion-basica' },
  { event: 'notificacion/enviar' },
  async ({ event, step }) => {
    const resultado = await step.run('enviar-mensaje-telegram', async () => {
      const mensaje = `📬 *Notificación Básica*\n\n${event.data.mensaje}`;
      return await enviarMensajeTelegram(mensaje);
    });

    return {
      enviado: true,
      mensaje: event.data.mensaje,
      telegramMessageId: resultado.result?.message_id
    };
  }
);
