import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, SetMetadata, Patch } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es requerido' })
  name!: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Request() req: any, @Body() body: CreateCategoryDto) {
    return this.categoriesService.create(req.user.storeId, body.name, body.parentId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.categoriesService.findAll(req.user.storeId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: CreateCategoryDto) {
    return this.categoriesService.update(req.user.storeId, id, body.name, body.parentId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.storeId, id);
  }
}
