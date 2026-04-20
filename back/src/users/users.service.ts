import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createStaff(storeId: string, data: any) {
    const { email, password, name, role } = data;

    if (!['WAITER', 'KITCHEN'].includes(role)) {
      throw new BadRequestException('Rol de personal inválido (Moso o Cocina únicamente)');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        storeId
      },
      select: { id: true, email: true, name: true, role: true }
    });
  }

  async findAllByStore(storeId: string) {
    return this.prisma.user.findMany({
      where: { 
        storeId,
        role: { in: ['WAITER', 'KITCHEN'] }
      },
      select: { id: true, email: true, name: true, role: true }
    });
  }

  async deleteStaff(id: string, storeId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, storeId, role: { in: ['WAITER', 'KITCHEN'] } }
    });

    if (!user) throw new BadRequestException('Usuario no encontrado o no pertenece a tu personal');

    return this.prisma.user.delete({ where: { id } });
  }
}
