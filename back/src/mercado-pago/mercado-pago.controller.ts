import { Controller, Get, Post, Body, Query, Req, Res, UseGuards, SetMetadata } from '@nestjs/common';
import { MercadoPagoService } from './mercado-pago.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('mercado-pago')
export class MercadoPagoController {
  
  constructor(private readonly mpService: MercadoPagoService) {}

  // Endpoint para recibir el código de autorización de Mercado Pago
  @Get('callback')
  async handleOAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (frontendUrl.endsWith('/')) frontendUrl = frontendUrl.slice(0, -1);

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/admin?error=NoCodeOrState`);
    }

    try {
      // state contiene el storeId
      const storeSlug = await this.mpService.handleOAuthCallback(code, state);
      return res.redirect(`${frontendUrl}/admin/${storeSlug}/settings?mp_success=true`);
    } catch (error: any) {
      const store = await this.mpService.getStoreById(state);
      const slug = store ? store.slug : 'login';
      return res.redirect(`${frontendUrl}/admin/${slug}/settings?error=OAuthFailed`);
    }
  }

  // Generar Preferencia de Pago
  @Post('preference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'CASHIER'])
  async createPreference(@Body() body: { items: any[], returnUrl: string, orderId?: string }, @Req() req: any) {
    return this.mpService.createPreference(req.user.storeId, body.items, body.returnUrl, body.orderId);
  }

  // Generar Preferencia de Pago de Suscripción SaaS (Comercios)
  @Post('subscription-preference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async createSubscriptionPreference(@Body() body: { returnUrl: string }, @Req() req: any) {
    return this.mpService.createSubscriptionPreference(req.user.storeId, body.returnUrl);
  }

  // Generar Preferencia de Pago Público (Catalogo Web)
  @Post('preference/public')
  async createPublicPreference(@Body() body: { storeId: string, items: any[], returnUrl: string, orderId?: string }) {
    return this.mpService.createPreference(body.storeId, body.items, body.returnUrl, body.orderId);
  }

  // Webhook e IPN
  @Post('webhook')
  async handleWebhook(
    @Query('type') type: string, 
    @Query('data.id') dataId: string, 
    @Query('topic') topic: string,
    @Query('id') id: string,
    @Query('storeId') storeId: string, 
    @Query('isSubscription') isSubscription: string,
    @Res() res: any
  ) {
    // Retornar 200 OK inmediatamente a Mercado Pago
    res.status(200).send('OK');

    const eventType = type || topic;
    const eventId = dataId || id;

    if (eventType === 'payment' && eventId) {
      if (isSubscription === 'true' || storeId === 'platform') {
        // Procesar pago de suscripción de la plataforma
        this.mpService.processSubscriptionWebhook(eventId);
      } else if (storeId) {
        // Procesar venta regular de un comercio
        this.mpService.processWebhook('payment', eventId, storeId);
      }
    }
  }
}
