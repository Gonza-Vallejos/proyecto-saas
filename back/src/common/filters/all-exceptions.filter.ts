import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : (exception as Error)?.message || 'Internal server error';

    const stack = (exception as Error)?.stack || '';

    // Intentar extraer el storeId de diferentes lugares de la petición
    const storeId =
      request.params?.storeId ||
      request.query?.storeId ||
      request.body?.storeId ||
      null;

    let storeName = 'No identificada (o ruta global)';
    if (storeId) {
      try {
        const store = await this.prisma.store.findUnique({
          where: { id: storeId },
          select: { name: true },
        });
        if (store) storeName = store.name;
      } catch (err) {
        this.logger.error('Error buscando nombre de la tienda para la alerta', err);
      }
    }

    // Enviar alerta a Telegram
    await this.sendTelegramAlert(storeName, status, request.url, message, stack);

    // Responder al cliente
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  private async sendTelegramAlert(
    storeName: string,
    status: number,
    url: string,
    message: string,
    stack: string
  ) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      this.logger.warn('Faltan credenciales TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en .env');
      return;
    }

    // Usamos HTML para formatear el mensaje en Telegram
    const text = `🚨 <b>NUEVO ERROR EN SIIT</b> 🚨
<b>Tienda:</b> ${storeName}
<b>Estado HTTP:</b> ${status}
<b>Endpoint:</b> <code>${url}</code>

<b>Mensaje:</b>
<code>${message}</code>

<b>Fecha:</b> ${new Date().toLocaleString('es-AR')}`;

    try {
      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      if (!res.ok) {
        this.logger.error(`Falló el envío de alerta a Telegram: ${await res.text()}`);
      }
    } catch (error) {
      this.logger.error('Error conectando con la API de Telegram', error);
    }
  }
}
