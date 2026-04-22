import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('public/:storeId')
  async createPublic(@Param('storeId') storeId: string, @Body() body: any) {
    return this.ordersService.create(storeId, null, { ...body, origin: 'WHATSAPP' });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'WAITER'])
  async create(@Request() req: any, @Body() body: any) {
    return this.ordersService.create(req.user.storeId, req.user.id, { ...body, origin: 'TABLE' });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'KITCHEN', 'WAITER'])
  async findAll(@Request() req: any, @Query('status') status?: string, @Query('origin') origin?: string) {
    return this.ordersService.findAllByStore(req.user.storeId, status, origin);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'KITCHEN', 'WAITER'])
  async updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateStatus(id, req.user.storeId, status);
  }
}
