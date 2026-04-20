import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'WAITER'])
  async create(@Request() req: any, @Body() body: any) {
    // Tomar el storeId del usuario logueado
    return this.ordersService.create(req.user.storeId, req.user.id, body);
  }

  @Get()
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'KITCHEN', 'WAITER'])
  async findAll(@Request() req: any, @Query('status') status?: string) {
    return this.ordersService.findAllByStore(req.user.storeId, status);
  }

  @Patch(':id/status')
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'KITCHEN', 'WAITER'])
  async updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateStatus(id, req.user.storeId, status);
  }
}
