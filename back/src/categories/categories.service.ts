import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(storeId: string, name: string, parentId?: string) {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    // Verificar si ya existe en esta tienda
    const existing = await this.prisma.category.findFirst({
      where: { storeId, slug }
    });
    
    if (existing) {
      throw new Error(`La categoría "${name}" ya existe.`);
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        storeId,
        parentId,
      },
    });
  }

  async update(storeId: string, id: string, name: string, parentId?: string | null) {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    // Verificar si el nuevo nombre choca con otra categoría
    if (category.name !== name) {
      const existing = await this.prisma.category.findFirst({
        where: { storeId, slug }
      });
      if (existing) throw new Error(`Ya existe otra categoría llamada "${name}".`);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        parentId: parentId === 'none' ? null : parentId,
      },
    });
  }

  async findAll(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId },
      include: { parent: true },
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
