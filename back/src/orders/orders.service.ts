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
    const { tableId, items, observations, customerName, customerPhone, origin } = data;

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

    const order = await this.prisma.order.create({
      data: {
        storeId,
        waiterId,
        tableId,
        observations,
        customerName,
        customerPhone,
        origin: origin || 'TABLE',
        total,
        status: 'PENDING',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    this.eventsGateway.notifyStoreOrdersUpdate(storeId);
    return order;
  }

  async findAllByStore(storeId: string, status?: string, origin?: string) {
    const where: any = { storeId };
    if (status) {
      where.status = status;
    } else {
      // Por defecto, traer pedidos no finalizados (no PAID/CANCELLED)
      where.status = { notIn: ['PAID', 'CANCELLED'] };
    }

    if (origin) {
      where.origin = origin;
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

      if (shouldDeductStock) {
        for (const item of order.items) {
          if (item.product.trackStock) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          }
        }
      }

      return updatedOrder;
    });

    this.eventsGateway.notifyStoreOrdersUpdate(storeId);
    return result;
  }
}
