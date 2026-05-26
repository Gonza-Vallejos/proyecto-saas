import { Controller, Get, Post, Body, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('cash-registers')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'CASHIER'])
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @Get('current')
  async getCurrent(@Request() req: any) {
    return this.cashRegistersService.getCurrent(req.user.storeId);
  }

  @Get('summary')
  async getSummary(@Request() req: any) {
    return this.cashRegistersService.getShiftSummary(req.user.storeId);
  }

  @Post('open')
  async open(@Request() req: any, @Body('initialCash') initialCash: number) {
    return this.cashRegistersService.open(req.user.storeId, Number(initialCash), req.user.id);
  }

  @Post('close')
  async close(@Request() req: any) {
    return this.cashRegistersService.close(req.user.storeId);
  }

  @Get('history')
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async getHistory(@Request() req: any) {
    return this.cashRegistersService.getHistory(req.user.storeId);
  }
}
