import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterSuperadminDto, UpdateProfileDto, LoginGoogleDto } from './auth.dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

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
    const user = await this.prisma.user.findUnique({ 
      where: { email: dto.email },
      include: { store: true }
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (!user.password) {
      throw new UnauthorizedException('Esta cuenta requiere inicio de sesión con Google');
    }

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
      slug: user.store?.slug || (user.role === 'SUPERADMIN' ? 'admin' : null)
    };
  }

  async loginGoogle(dto: LoginGoogleDto) {
    let email: string;
    let name: string | undefined;

    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: dto.token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Token de Google inválido');
      }
      email = payload.email;
      name = payload.name;
    } catch (error) {
      throw new UnauthorizedException('Error al verificar el token de Google');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { store: true }
    });

    if (!user) {
      throw new UnauthorizedException('El correo electrónico no está registrado en el sistema.');
    }

    // Generar el Token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      storeId: user.storeId,
      name: user.name || name 
    };
    return {
      access_token: this.jwtService.sign(payload),
      slug: user.store?.slug || (user.role === 'SUPERADMIN' ? 'admin' : null)
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
