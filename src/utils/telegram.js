import axios from 'axios';

/**
 * Envía un mensaje a un chat de Telegram
 * @param {string} mensaje - Texto del mensaje a enviar
 * @returns {Promise<Object>} - Respuesta de la API de Telegram
 */
export async function enviarMensajeTelegram(mensaje) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados');
    console.log('Mensaje que se enviaría:', mensaje);
    return { ok: true, result: { message_id: 'demo' } };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: mensaje,
      parse_mode: 'Markdown'
    });

    return response.data;
  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error.message);
    throw error;
  }
}

/**
 * Obtiene actualizaciones del bot para extraer el chat_id
 * @returns {Promise<Object>} - Últimas actualizaciones
 */
export async function obtenerActualizaciones() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN no configurado');
  }

  const url = `https://api.telegram.org/bot${token}/getUpdates`;
  const response = await axios.get(url);
  return response.data;
}
