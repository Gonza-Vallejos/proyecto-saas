import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(storeId: string, waiterId: string, data: any) {
    const { tableId, items, observations } = data;

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

  async findAllByStore(storeId: string, status?: string) {
    const where: any = { storeId };
    if (status) {
      where.status = status;
    } else {
      // Por defecto, traer pedidos no finalizados (no PAID/CANCELLED)
      where.status = { notIn: ['PAID', 'CANCELLED'] };
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
    const order = await this.prisma.order.findFirst({ where: { id, storeId } });
    if (!order) throw new BadRequestException('Pedido no encontrado');

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, table: true },
    });

    this.eventsGateway.notifyStoreOrdersUpdate(storeId);
    return updatedOrder;
  }
}
