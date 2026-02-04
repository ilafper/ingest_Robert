import { inngest } from '../client.js';
import { enviarMensajeTelegram } from '../../utils/telegram.js';

/**
 * Ejemplo 4: Workflow Multi-Paso
 *
 * Demuestra:
 * - Encadenamiento de múltiples steps
 * - Uso de step.sleep para delays
 * - Mantener estado entre steps
 * - Flujo complejo con múltiples acciones
 */
export const onboardingUsuario = inngest.createFunction(
  { id: 'onboarding-usuario' },
  { event: 'usuario/registro' },
  async ({ event, step }) => {
    // Step 1: Mensaje de bienvenida
    await step.run('enviar-bienvenida', async () => {
      const mensaje = `👋 *¡Bienvenido ${event.data.nombre}!*\n\n` +
        `Gracias por registrarte con el email: ${event.data.email}\n\n` +
        `En los próximos minutos recibirás más información.`;

      return await enviarMensajeTelegram(mensaje);
    });

    // Step 2: Esperar 10 segundos
    await step.sleep('espera-inicial', '10s');

    // Step 3: Recordatorio de configuración
    await step.run('enviar-recordatorio-configuracion', async () => {
      const mensaje = `⚙️  *Configura tu Perfil*\n\n` +
        `Hola ${event.data.nombre},\n\n` +
        `No olvides completar tu perfil para aprovechar todas las funcionalidades.`;

      return await enviarMensajeTelegram(mensaje);
    });

    // Step 4: Esperar otros 10 segundos
    await step.sleep('espera-tips', '10s');

    // Step 5: Enviar tips de uso
    await step.run('enviar-tips', async () => {
      const mensaje = `💡 *Tips de Uso*\n\n` +
        `• Explora el dashboard\n` +
        `• Configura tus notificaciones\n` +
        `• Invita a tus compañeros\n\n` +
        `¡Que disfrutes la plataforma!`;

      return await enviarMensajeTelegram(mensaje);
    });

    return {
      usuario: event.data.nombre,
      email: event.data.email,
      onboardingCompletado: true,
      pasos: 5
    };
  }
);
