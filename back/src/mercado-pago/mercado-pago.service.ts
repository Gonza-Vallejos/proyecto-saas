import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  
  constructor(private prisma: PrismaService) {}

  async handleOAuthCallback(code: string, storeId: string) {
    try {
      let backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      if (backendUrl.endsWith('/')) backendUrl = backendUrl.slice(0, -1);
      const redirectUri = `${backendUrl}/mercado-pago/callback`;
      
      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MP_CLIENT_ID || '',
          client_secret: process.env.MP_CLIENT_SECRET || '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        this.logger.error('MP OAuth Error', data);
        throw new BadRequestException('Error en respuesta de Mercado Pago');
      }

      const store = await this.prisma.store.update({
        where: { id: storeId },
        data: {
          mercadoPagoAccessToken: data.access_token,
          mercadoPagoPublicKey: data.public_key
        }
      });
      
      return store.slug;
    } catch (e: any) {
      this.logger.error('Error linking MP account', e.message);
      throw new BadRequestException('Error vinculando cuenta de Mercado Pago');
    }
  }

  async createPreference(storeId: string, items: any[], returnUrl: string, orderId?: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId }});
    if (!store?.mercadoPagoAccessToken) {
      throw new BadRequestException('La tienda no tiene Mercado Pago vinculado');
    }

    const client = new MercadoPagoConfig({ accessToken: store.mercadoPagoAccessToken });
    const preference = new Preference(client);

    const body: any = {
      items: items.map(item => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        unit_price: Number(item.price)
      })),
      back_urls: {
        success: `${returnUrl}?mp_status=success`,
        failure: `${returnUrl}?mp_status=failure`,
        pending: `${returnUrl}?mp_status=pending`
      },
      auto_return: 'approved'
    };

    if (orderId) {
      body.external_reference = orderId;
    }

    // Agregar webhook si está en producción o si se especifica la URL del backend
    // Mercado Pago requiere URLs HTTPS para los webhooks
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl && backendUrl.startsWith('https')) {
      body.notification_url = `${backendUrl}/mercado-pago/webhook?storeId=${storeId}`;
    }

    const response = await preference.create({ body });
    return { 
      init_point: response.init_point,
      id: response.id
    };
  }

  async processWebhook(type: string, dataId: string, storeId: string) {
    if (type !== 'payment') return;

    try {
      const store = await this.prisma.store.findUnique({ where: { id: storeId }});
      if (!store?.mercadoPagoAccessToken) return;

      // Obtener detalles del pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: {
          'Authorization': `Bearer ${store.mercadoPagoAccessToken}`
        }
      });
      const payment = await response.json();

      if (payment.status === 'approved' && payment.external_reference) {
        // Actualizar el pedido en la BD
        const orderId = payment.external_reference;
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' }
        });
        this.logger.log(`Pedido ${orderId} pagado exitosamente vía MP`);
        // Opcional: Emitir WebSocket para Kitchen/Waiter aquí (el EventsGateway puede manejarlo si conectamos OrdersService)
      }
    } catch (e: any) {
      this.logger.error(`Error procesando webhook de MP para store ${storeId}`, e.message);
    }
  }
}
