import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreMasterDto } from './dto/update-store-master.dto';
import { UpdateStoreAppearanceDto } from './dto/update-appearance.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStoreDto) {
    const existingStore = await this.prisma.store.findUnique({ where: { slug: data.slug } });
    if (existingStore) throw new BadRequestException('El slug de esta tienda ya está en uso');

    const existingUser = await this.prisma.user.findUnique({ where: { email: data.ownerEmail } });
    if (existingUser) throw new BadRequestException('El email del dueño ya está ligado a otra cuenta');

    const hashedPassword = await bcrypt.hash(data.ownerPassword, 10);

    const store = await this.prisma.store.create({
      data: {
        name: data.name,
        slug: data.slug,
        businessType: data.businessType || 'retail',
        hasStockControl: data.hasStockControl || false,
        hasPayments: data.hasPayments || false,
        hasCart: data.hasCart || false,
        isCatalogOnly: data.isCatalogOnly || false,
        hasModifiers: data.hasModifiers || false,
        showObservations: data.showObservations || false,
        hasConnectivity: data.hasConnectivity || false,
        hasOrderManagement: data.hasOrderManagement || false,
        hasWhatsAppOrders: data.hasWhatsAppOrders || false,
        hasPOS: data.hasPOS || false,
        hasMercadoPago: data.hasMercadoPago || false,
        primaryColor: data.primaryColor || '#0ea5e9',
        textColor: data.textColor || '#1e293b',
        iconColor: data.iconColor || '#64748b',
        users: {
          create: {
            email: data.ownerEmail,
            name: data.ownerName, // Nuevo: nombre del dueño
            password: hashedPassword,
            role: 'STORE_ADMIN'
          }
        }
      },
      include: {
        users: {
          select: { id: true, email: true, role: true, name: true }
        }
      }
    });

    return store;
  }

  async getCatalogBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        products: {
          orderBy: { createdAt: 'desc' },
          include: { 
            category: true,
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: { options: true }
                }
              }
            }
          }
        },
        categories: {
          orderBy: { name: 'asc' }
        }
      }
    });
    if (!store) throw new BadRequestException('Tienda no encontrada');
    return store;
  }

  async updateMyStore(storeId: string, data: UpdateStoreAppearanceDto) {
    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name,
        description: data.description,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        bgColor: data.bgColor,
        textColor: data.textColor,
        iconColor: data.iconColor,
        fontFamily: data.fontFamily,
        cardStyle: data.cardStyle,
        heroStyle: data.heroStyle,
        logoUrl: data.logoUrl,
        heroImageUrl: data.heroImageUrl,
        phone: data.phone,
        instagram: data.instagram,
        facebook: data.facebook,
        whatsapp: data.whatsapp,
        address: data.address,
        businessHours: data.businessHours,
        wifiSSID: data.wifiSSID,
        wifiPassword: data.wifiPassword,
      }
    });
  }

  async updateStoreMaster(id: string, data: UpdateStoreMasterDto) {
    const owner = await this.prisma.user.findFirst({
      where: { storeId: id, role: 'STORE_ADMIN' }
    });

    if (data.slug) {
      const existing = await this.prisma.store.findFirst({
        where: { slug: data.slug, NOT: { id } }
      });
      if (existing) throw new BadRequestException('El nuevo slug ya está en uso por otra tienda');
    }

    const productsCount = await this.prisma.product.count({ where: { storeId: id } });
    
    const updateData: any = {
      name: data.name,
      slug: data.slug,
      businessType: data.businessType,
      hasStockControl: data.hasStockControl,
      hasPayments: data.hasPayments,
      hasCart: data.hasCart,
      isCatalogOnly: data.isCatalogOnly,
      hasModifiers: data.hasModifiers,
      showObservations: data.showObservations,
      hasConnectivity: data.hasConnectivity,
      hasOrderManagement: data.hasOrderManagement,
      hasWhatsAppOrders: data.hasWhatsAppOrders,
      hasPOS: data.hasPOS,
      hasMercadoPago: data.hasMercadoPago,
    };

    // Validación crítica: No permitir cambiar control de stock si ya hay productos
    if (data.hasStockControl !== undefined) {
      const currentStore = await this.prisma.store.findUnique({ where: { id } });
      if (currentStore && currentStore.hasStockControl !== data.hasStockControl && productsCount > 0) {
        throw new BadRequestException('No puedes cambiar la política de stock si la tienda ya tiene productos cargados. Elimina los productos o crea una nueva tienda.');
      }
    }

    // Aplicar reglas de dependencias SaaS
    if (updateData.hasCart === false) {
      updateData.hasStockControl = false;
      updateData.hasPayments = false;
    }

    if (updateData.isCatalogOnly === true) {
      updateData.hasCart = false;
      updateData.hasStockControl = false;
      updateData.hasPayments = false;
    }

    if (owner && (data.ownerEmail || data.ownerPassword || data.ownerName)) {
      const userUpdate: any = {};
      if (data.ownerEmail) userUpdate.email = data.ownerEmail;
      if (data.ownerName) userUpdate.name = data.ownerName;
      if (data.ownerPassword) userUpdate.password = await bcrypt.hash(data.ownerPassword, 10);
      
      await this.prisma.user.update({
        where: { id: owner.id },
        data: userUpdate
      });
    }

    return this.prisma.store.update({
      where: { id },
      data: updateData
    });
  }

  async deleteStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new BadRequestException('Tienda no encontrada');

    await this.prisma.store.delete({ where: { id } });
    return { message: `Tienda "${store.name}" eliminada correctamente junto con todos sus datos.` };
  }

  async findAll() {
    return this.prisma.store.findMany({
      include: {
        users: {
          where: { role: 'STORE_ADMIN' },
          select: { email: true, name: true }
        },
        _count: { 
          select: { 
            products: true, 
            users: true,
            categories: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
