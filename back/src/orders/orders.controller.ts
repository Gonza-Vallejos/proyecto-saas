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
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'WAITER', 'CASHIER'])
  async create(@Request() req: any, @Body() body: any) {
    return this.ordersService.create(req.user.storeId, req.user.id, { 
      ...body, 
      origin: body.origin || 'TABLE',
      status: body.status || 'PENDING'
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'KITCHEN', 'WAITER'])
  async findAll(@Request() req: any, @Query('status') status?: string, @Query('origin') origin?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.ordersService.findAllByStore(req.user.storeId, status, origin, startDate, endDate);
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
