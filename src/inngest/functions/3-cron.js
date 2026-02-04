import { inngest } from '../client.js';
import { enviarMensajeTelegram } from '../../utils/telegram.js';

/**
 * Ejemplo 3: Tarea Programada (Cron)
 *
 * Demuestra:
 * - Trigger basado en cron expression
 * - Ejecución periódica automática
 * - Generación de reportes
 */
export const reportePeriodico = inngest.createFunction(
  { id: 'reporte-periodico' },
  { cron: '0 */2 * * *' },  // Cada 2 horas (para demo, ajustar según necesidad)
  async ({ step }) => {
    const reporte = await step.run('generar-reporte', async () => {
      // Simular generación de reporte con datos ficticios
      const ahora = new Date();
      const datos = {
        timestamp: ahora.toISOString(),
        usuariosActivos: Math.floor(Math.random() * 100) + 50,
        pedidosProcesados: Math.floor(Math.random() * 20) + 5,
        erroresTotales: Math.floor(Math.random() * 3)
      };

      return datos;
    });

    await step.run('enviar-reporte-telegram', async () => {
      const mensaje = `📊 *Reporte Periódico*\n\n` +
        `🕐 ${new Date(reporte.timestamp).toLocaleString('es-ES')}\n\n` +
        `👥 Usuarios activos: ${reporte.usuariosActivos}\n` +
        `📦 Pedidos procesados: ${reporte.pedidosProcesados}\n` +
        `⚠️  Errores: ${reporte.erroresTotales}`;

      return await enviarMensajeTelegram(mensaje);
    });

    return reporte;
  }
);
