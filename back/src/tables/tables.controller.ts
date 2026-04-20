import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async create(@Request() req: any, @Body() body: { number: string; capacity?: number }) {
    return this.tablesService.create(req.user.storeId, body);
  }

  @Get()
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'WAITER'])
  async findAll(@Request() req: any) {
    return this.tablesService.findAllByStore(req.user.storeId);
  }

  @Patch(':id')
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.tablesService.update(id, req.user.storeId, body);
  }

  @Delete(':id')
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.tablesService.delete(id, req.user.storeId);
  }
}
