import { Controller, Get, Query, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['STORE_ADMIN', 'SUPERADMIN']) // Restrict to admins
  async getOverview(@Request() req: any, @Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.statisticsService.getOverview(req.user.storeId, daysNumber);
  }
}
