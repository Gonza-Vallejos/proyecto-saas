import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(storeId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all orders for this store within the date range
    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          }
        }
      }
    });

    // Calculate basic metrics
    let totalRevenue = 0;
    let totalOrders = orders.length;
    
    // Group by date for the line chart
    const revenueByDateMap = new Map<string, number>();
    
    // Top products map
    const productSalesMap = new Map<string, { name: string, quantity: number, revenue: number }>();

    for (const order of orders) {
      // Only count PAID or DELIVERED for revenue
      if (order.status === 'PAID' || order.status === 'DELIVERED') {
        totalRevenue += order.total;
      }

      // Group revenue by date (YYYY-MM-DD)
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!revenueByDateMap.has(dateKey)) {
        revenueByDateMap.set(dateKey, 0);
      }
      
      // We'll count revenue in the chart only for completed orders, or all? Usually all valid orders.
      if (order.status !== 'CANCELLED') {
        revenueByDateMap.set(dateKey, revenueByDateMap.get(dateKey)! + order.total);
      }

      // Aggregate products (for non-cancelled orders)
      if (order.status !== 'CANCELLED') {
        for (const item of order.items) {
          if (!item.product) continue; // In case product was deleted
          
          const productId = item.productId!;
          if (!productSalesMap.has(productId)) {
            productSalesMap.set(productId, { 
              name: item.product.name, 
              quantity: 0,
              revenue: 0 
            });
          }
          
          const p = productSalesMap.get(productId)!;
          p.quantity += item.quantity;
          p.revenue += (item.priceAtTime * item.quantity);
        }
      }
    }

    // Format revenue by date into a sorted array for charts
    const revenueByDate = Array.from(revenueByDateMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // top 5

    return {
      totalRevenue,
      totalOrders,
      revenueByDate,
      topProducts,
    };
  }
}
