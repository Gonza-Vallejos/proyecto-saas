import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('staff')
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async createStaff(@Request() req: any, @Body() body: any) {
    return this.usersService.createStaff(req.user.storeId, body);
  }

  @Get('staff')
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async findAllStaff(@Request() req: any) {
    return this.usersService.findAllByStore(req.user.storeId);
  }

  @Delete('staff/:id')
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN'])
  async deleteStaff(@Param('id') id: string, @Request() req: any) {
    return this.usersService.deleteStaff(id, req.user.storeId);
  }
}
