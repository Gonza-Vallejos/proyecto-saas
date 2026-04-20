import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNumber, IsBoolean, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OptionDto {
  @IsOptional()
  @IsString({ message: 'El ID de la opción debe ser un texto.' })
  id?: string;

  @IsString({ message: 'El nombre de la opción es obligatorio.' })
  name!: string;

  @IsNumber({}, { message: 'El precio de la opción debe ser un número válido.' })
  price!: number;
}

export class CreateModifierGroupDto {
  @IsString({ message: 'El nombre del grupo es obligatorio.' })
  name!: string;

  @IsNumber({}, { message: 'El mínimo de selección debe ser un número.' })
  minSelected!: number;

  @IsNumber({}, { message: 'El máximo de selección debe ser un número.' })
  maxSelected!: number;

  @IsBoolean({ message: 'El campo obligatorio debe ser verdadero o falso.' })
  isRequired!: boolean;

  @IsArray({ message: 'Las opciones deben enviarse como una lista.' })
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options!: OptionDto[];
}

export class UpdateModifierGroupDto extends CreateModifierGroupDto {}

@Injectable()
export class ModifiersService {
  constructor(private prisma: PrismaService) {}

  async findAllByStore(storeId: string) {
    return this.prisma.modifierGroup.findMany({
      where: { storeId },
      include: {
        options: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(storeId: string, data: CreateModifierGroupDto) {
    if (!data.options || data.options.length === 0) {
      throw new BadRequestException('El grupo debe tener al menos una opción.');
    }

    return this.prisma.modifierGroup.create({
      data: {
        storeId,
        name: data.name,
        minSelected: data.minSelected,
        maxSelected: data.maxSelected,
        isRequired: data.isRequired,
        options: {
          create: data.options.map(opt => ({
            name: opt.name,
            price: Number(opt.price) || 0
          }))
        }
      },
      include: {
        options: true
      }
    });
  }

  async update(storeId: string, id: string, data: UpdateModifierGroupDto) {
    // Verificar propiedad
    const group = await this.prisma.modifierGroup.findFirst({ where: { id, storeId } });
    if (!group) throw new BadRequestException('Grupo no encontrado o no pertenece a tu tienda');

    if (!data.options || data.options.length === 0) {
      throw new BadRequestException('El grupo debe tener al menos una opción.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Borrar opciones viejas
      await tx.modifierOption.deleteMany({
        where: { modifierGroupId: id }
      });

      // 2. Actualizar grupo y crear nuevas opciones
      return tx.modifierGroup.update({
        where: { id },
        data: {
          name: data.name,
          minSelected: data.minSelected,
          maxSelected: data.maxSelected,
          isRequired: data.isRequired,
          options: {
            create: data.options.map(opt => ({
              name: opt.name,
              price: Number(opt.price) || 0
            }))
          }
        },
        include: {
          options: true
        }
      });
    });
  }

  async remove(storeId: string, id: string) {
    const group = await this.prisma.modifierGroup.findFirst({ where: { id, storeId } });
    if (!group) throw new BadRequestException('Grupo no encontrado o no pertenece a tu tienda');

    // onDelete: Cascade se encarga de borrar las opciones y dependencias de ProductModifierGroup
    await this.prisma.modifierGroup.delete({ where: { id } });
    return { success: true };
  }
}
