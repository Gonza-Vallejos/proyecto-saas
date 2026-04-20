import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async create(storeId: string, data: { number: string; capacity?: number }) {
    return this.prisma.table.create({
      data: {
        number: data.number,
        capacity: data.capacity || 2,
        storeId,
      },
    });
  }

  async findAllByStore(storeId: string) {
    return this.prisma.table.findMany({
      where: { storeId },
      orderBy: { number: 'asc' },
    });
  }

  async update(id: string, storeId: string, data: { number?: string; capacity?: number; isActive?: boolean }) {
    const table = await this.prisma.table.findFirst({ where: { id, storeId } });
    if (!table) throw new BadRequestException('Mesa no encontrada');

    return this.prisma.table.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, storeId: string) {
    const table = await this.prisma.table.findFirst({ where: { id, storeId } });
    if (!table) throw new BadRequestException('Mesa no encontrada');

    return this.prisma.table.delete({ where: { id } });
  }
}
