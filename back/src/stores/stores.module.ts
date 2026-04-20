import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [StoresService, PrismaService],
  controllers: [StoresController]
})
export class StoresModule {}
