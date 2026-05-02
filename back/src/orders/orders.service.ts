import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(storeId: string, waiterId: string | null, data: any) {
    const { tableId, items, observations, customerName, customerPhone, origin, status } = data;

    // Calcular total y preparar ítems
    let total = 0;
    const orderItems = items.map((item: any) => {
      total += item.priceAtTime * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        observations: item.observations,
        selectedModifiers: item.selectedModifiers ? JSON.stringify(item.selectedModifiers) : null,
      };
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Verificar stock si es pedido de WhatsApp, POS o Catálogo (MP)
      if (origin === 'WHATSAPP' || origin === 'POS' || origin === 'CATALOG') {
        for (const item of items) {
          const product = await tx.product.findUnique({ 
            where: { id: item.productId },
            include: { bundleItems: { include: { product: true } } }
          });
          
          if (!product) continue;

          if (product.isBundle) {
            // Validar stock de cada componente
            for (const bundleItem of product.bundleItems) {
              if (bundleItem.product.trackStock && bundleItem.product.stock < (item.quantity * bundleItem.quantity)) {
                throw new BadRequestException(`Stock insuficiente para componente: ${bundleItem.product.name} (parte de la promo). Disponible: ${bundleItem.product.stock}`);
              }
            }
          } else if (product.trackStock && product.stock < item.quantity) {
            throw new BadRequestException(`Stock insuficiente para: ${product.name}. Disponible: ${product.stock}`);
          }
        }
      }

      // 2. Crear el pedido
      const order = await tx.order.create({
        data: {
          storeId,
          waiterId,
          tableId,
          observations,
          customerName,
          customerPhone,
          origin: origin || 'TABLE',
          total,
          status: status || 'PENDING',
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          table: true,
        },
      });

      // 3. Descontar stock inmediatamente si es WhatsApp, POS o Catálogo (MP)
      if (origin === 'WHATSAPP' || origin === 'POS' || origin === 'CATALOG') {
        for (const item of items) {
          const product = await tx.product.findUnique({ 
            where: { id: item.productId },
            include: { bundleItems: true }
          });
          
          if (!product) continue;

          if (product.isBundle) {
            // Descontar stock de cada componente
            for (const bundleItem of product.bundleItems) {
              await tx.product.update({
                where: { id: bundleItem.productId },
                data: { stock: { decrement: item.quantity * bundleItem.quantity } }
              });
            }
          } else if (product.trackStock) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      return order;
    });

    this.eventsGateway.notifyStoreOrdersUpdate(storeId);
    return result;
  }

  async findAllByStore(storeId: string, status?: string, origin?: string, startDate?: string, endDate?: string) {
    const where: any = { storeId };
    
    if (status && status !== 'all') {
      where.status = status;
    } else if (!status) {
      // Por defecto (monitores), traer pedidos no finalizados
      where.status = { notIn: ['PAID', 'CANCELLED'] };
    }

    if (origin) {
      where.origin = origin;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && startDate.trim() !== '') {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (endDate && endDate.trim() !== '') {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) where.createdAt.lte = d;
      }
      if (Object.keys(where.createdAt).length === 0) delete where.createdAt;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true,
        waiter: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, storeId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, storeId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true,
        waiter: {
          select: { name: true }
        }
      }
    });
    if (!order) throw new BadRequestException('Pedido no encontrado');
    return order;
  }

  async updateStatus(id: string, storeId: string, status: string) {
    const order = await this.prisma.order.findFirst({ 
      where: { id, storeId },
      include: { items: { include: { product: true } } }
    });
    if (!order) throw new BadRequestException('Pedido no encontrado');

    // Si el pedido no estaba READY y ahora cambia a READY, descontamos stock
    const shouldDeductStock = status === 'READY' && order.status !== 'READY';

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: { items: true, table: true },
      });

      if (shouldDeductStock && order.origin !== 'WHATSAPP') {
        for (const item of order.items) {
          if (item.product.trackStock) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity }
              }
            });
          }
        }
      }

      // Nueva Lógica: Reintegro de stock si se cancela un pedido que ya lo había descontado
      const shouldRestoreStock = status === 'CANCELLED' && order.status !== 'CANCELLED';
      if (shouldRestoreStock) {
        // Se reintegra si:
        // 1. Era WhatsApp o POS (descontó al inicio)
        // 2. Era Table pero ya estaba en estado READY (descontó al pasar a READY)
        const wasAlreadyDeducted = order.origin === 'WHATSAPP' || order.origin === 'POS' || order.status === 'READY';
        
        if (wasAlreadyDeducted) {
          for (const item of order.items) {
            if (item.product.trackStock) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { increment: item.quantity }
                }
              });
            }
          }
        }
      }

      return updatedOrder;
    });

    this.eventsGateway.notifyStoreOrdersUpdate(storeId);
    return result;
  }
}
