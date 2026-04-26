import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(storeId: string, data: CreateProductDto) {
    if (!storeId) throw new ForbiddenException('Tu cuenta no está enlazada a una tienda');
    
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        trackStock: data.trackStock || false,
        stock: data.stock || 0,
        barcode: data.barcode || null,
        storeId,
        modifierGroups: data.modifierGroupIds && data.modifierGroupIds.length > 0 
          ? {
              create: data.modifierGroupIds.map(id => ({ modifierGroupId: id }))
            }
          : undefined
      },
    });
  }

  async findAllForAdmin(storeId: string) {
    return this.prisma.product.findMany({
      where: { storeId },
      include: {
        category: true,
        modifierGroups: {
          include: { modifierGroup: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(storeId: string, productId: string) {
    // Validamos que el producto realmente pertenezca a la tienda del admin que lo pide
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId }
    });
    if (!product) throw new NotFoundException('Producto no encontrado en tu tienda');

    return this.prisma.product.delete({ where: { id: productId } });
  }

  async update(storeId: string, productId: string, data: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId }
    });
    if (!product) throw new NotFoundException('Producto no encontrado en tu tienda');

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        trackStock: data.trackStock,
        stock: data.stock,
        barcode: data.barcode,
      }
    });
    
    // Actualizar relaciones de modificadores si fueron pasadas en la request
    if (data.modifierGroupIds !== undefined) {
      // 1. Borrar asociaciones viejas
      await this.prisma.productModifierGroup.deleteMany({
        where: { productId }
      });

      const mods: string[] = data.modifierGroupIds || [];
      // 2. Crear las nuevas (si hay)
      if (mods.length > 0) {
        await this.prisma.productModifierGroup.createMany({
          data: mods.map(id => ({
            productId,
            modifierGroupId: id
          }))
        });
      }
    }

    return updatedProduct;
  }

  async findByBarcode(storeId: string, barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        storeId_barcode: {
          storeId,
          barcode
        }
      }
    });

    if (!product) throw new NotFoundException('Producto no encontrado con ese código');
    return product;
  }
}
