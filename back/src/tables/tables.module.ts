import { Module } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [TablesController],
  providers: [TablesService],
  imports: [PrismaModule],
})
export class TablesModule {}
