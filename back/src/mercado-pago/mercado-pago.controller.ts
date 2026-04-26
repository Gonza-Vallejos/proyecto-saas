import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mercado-pago')
export class MercadoPagoController {
  
  // Endpoint para recibir el código de autorización de Mercado Pago
  @Get('callback')
  async handleOAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/admin/settings?error=NoCode`);
    }

    // TODO: 
    // 1. Tomar el 'code' y hacer POST a https://api.mercadopago.com/oauth/token
    // 2. Usar CLIENT_ID y CLIENT_SECRET de la cuenta maestra del SaaS
    // 3. Obtener el access_token y refresh_token
    // 4. Buscar la tienda (storeId = state) y guardar los tokens en la DB
    
    // Por ahora redirigimos con éxito falso
    return res.redirect(`${process.env.FRONTEND_URL}/admin/settings?mp_success=true`);
  }
}
