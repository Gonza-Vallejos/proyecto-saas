import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreMasterDto } from './dto/update-store-master.dto';
import { UpdateStoreAppearanceDto } from './dto/update-appearance.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly prisma: PrismaService,
  ) {}

  // Endpoint público: No requiere JWT
  @Get('public/:slug/catalog')
  async getCatalog(@Param('slug') slug: string) {
    return this.storesService.getCatalogBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN', 'WAITER'])
  @Get('my-store')
  async getMyStore(@Request() req: any) {
    return this.prisma.store.findUnique({ where: { id: req.user.storeId } });
  }

  // 1. Requerir estar logueado (Tener Token JWT válido)
  @UseGuards(JwtAuthGuard, RolesGuard)
  // 2. Requerir que el usuario sea SUPERADMIN excluyentemente
  @SetMetadata('roles', ['SUPERADMIN'])
  @Post()
  async createStore(@Body() body: CreateStoreDto) {
    return this.storesService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  @Patch('my-store')
  async updateMyStore(@Request() req: any, @Body() body: UpdateStoreAppearanceDto) {
    return this.storesService.updateMyStore(req.user.storeId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['SUPERADMIN'])
  @Patch(':id')
  async updateStoreMaster(@Param('id') id: string, @Body() body: UpdateStoreMasterDto) {
    return this.storesService.updateStoreMaster(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['SUPERADMIN'])
  @Get()
  async listAllStores() {
    return this.storesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['SUPERADMIN'])
  @Delete(':id')
  async deleteStore(@Param('id') id: string) {
    return this.storesService.deleteStore(id);
  }
}
