import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(storeId: string, name: string) {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    return this.prisma.category.create({
      data: {
        name,
        slug,
        storeId,
      },
    });
  }

  async findAll(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
  }

  async remove(storeId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    
    return this.prisma.category.delete({ where: { id } });
  }
}
