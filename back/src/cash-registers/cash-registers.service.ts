import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashRegistersService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(storeId: string) {
    return this.prisma.cashRegister.findFirst({
      where: { storeId, closedAt: null },
      orderBy: { openedAt: 'desc' },
    });
  }

  async open(storeId: string, initialCash: number) {
    const current = await this.getCurrent(storeId);
    if (current) {
      throw new BadRequestException('La caja ya está abierta');
    }

    return this.prisma.cashRegister.create({
      data: {
        storeId,
        initialCash,
      },
    });
  }

  async close(storeId: string) {
    const current = await this.getCurrent(storeId);
    if (!current) {
      throw new BadRequestException('No hay una caja abierta');
    }

    // Calcular ventas en efectivo del turno
    // Todas las ordenes de esta tienda, pagadas con CASH, creadas o pagadas después de la apertura de caja
    const cashOrders = await this.prisma.order.findMany({
      where: {
        storeId,
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        updatedAt: {
          gte: current.openedAt,
        },
      },
    });

    const cashSales = cashOrders.reduce((sum, order) => sum + order.total, 0);
    const expectedCash = current.initialCash + cashSales;

    return this.prisma.cashRegister.update({
      where: { id: current.id },
      data: {
        closedAt: new Date(),
        finalCash: expectedCash, // Opcionalmente podría ser un input manual del usuario para registrar diferencias
        expectedCash,
      },
    });
  }

  async getShiftSummary(storeId: string) {
    const current = await this.getCurrent(storeId);
    if (!current) return null;

    // Pedidos cobrados en efectivo
    const cashOrders = await this.prisma.order.findMany({
      where: {
        storeId,
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        updatedAt: { gte: current.openedAt },
      },
    });

    // Pedidos cobrados con MP
    const mpOrders = await this.prisma.order.findMany({
      where: {
        storeId,
        paymentStatus: 'PAID',
        paymentMethod: 'MERCADOPAGO',
        updatedAt: { gte: current.openedAt },
      },
    });

    const totalCash = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const totalMp = mpOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      openedAt: current.openedAt,
      initialCash: current.initialCash,
      cashSales: totalCash,
      mpSales: totalMp,
      expectedCash: current.initialCash + totalCash,
      totalSales: totalCash + totalMp,
    };
  }
}
