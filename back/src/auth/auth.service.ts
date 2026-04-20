import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterSuperadminDto, UpdateProfileDto } from './auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async registerSuperadmin(dto: RegisterSuperadminDto) {
    // Seguridad básica para que no cualquier persona se haga superadmin
    if (dto.secretKey !== 'CREAR_DUEÑO_SECRETO') {
      throw new BadRequestException('Llave secreta inválida. No puedes crear un Super Admin.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email }});
    if (existingUser) throw new BadRequestException('El correo ya está registrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: 'SUPERADMIN' 
      }
    });

    return { message: 'Superadmin creado exitosamente', userId: user.id };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    // Generar el Token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      storeId: user.storeId,
      name: user.name 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) throw new BadRequestException('El email ya está en uso');
      data.email = dto.email;
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, storeId: true }
    });
  }
}
