import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ModifiersService, CreateModifierGroupDto, UpdateModifierGroupDto } from './modifiers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';

@Controller('modifiers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  @SetMetadata('roles', ['STORE_ADMIN'])
  @Get()
  findAll(@Request() req: any) {
    return this.modifiersService.findAllByStore(req.user.storeId);
  }

  @SetMetadata('roles', ['STORE_ADMIN'])
  @Post()
  create(@Request() req: any, @Body() createDto: CreateModifierGroupDto) {
    return this.modifiersService.create(req.user.storeId, createDto);
  }

  @SetMetadata('roles', ['STORE_ADMIN'])
  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateModifierGroupDto) {
    return this.modifiersService.update(req.user.storeId, id, updateDto);
  }

  @SetMetadata('roles', ['STORE_ADMIN'])
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.modifiersService.remove(req.user.storeId, id);
  }
}
