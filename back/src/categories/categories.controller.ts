import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es requerido' })
  name!: string;
}

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Request() req: any, @Body() body: CreateCategoryDto) {
    return this.categoriesService.create(req.user.storeId, body.name);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.categoriesService.findAll(req.user.storeId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.storeId, id);
  }
}
