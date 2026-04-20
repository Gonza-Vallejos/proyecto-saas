import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './products.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN']) // SUPERADMIN por si queremos que vea todo más adelante
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Request() req: any, @Body() data: CreateProductDto) {
    // req.user viene del token JWT decodificado
    return this.productsService.create(req.user.storeId, data);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.productsService.findAllForAdmin(req.user.storeId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.productsService.remove(req.user.storeId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.productsService.update(req.user.storeId, id, data);
  }
}
