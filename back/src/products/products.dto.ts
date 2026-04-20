import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'El nombre debe ser un texto.' })
  name!: string;

  @IsString({ message: 'La descripción debe ser un texto.' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'El precio debe ser un número válido.' })
  price!: number;

  @IsString({ message: 'La URL de la imagen debe ser un texto.' })
  @IsOptional()
  imageUrl?: string;

  @IsUUID('all', { message: 'El ID de la categoría debe ser un UUID válido.' })
  @IsOptional()
  categoryId?: string;

  @IsBoolean({ message: 'El control de stock debe ser un valor booleano.' })
  @IsOptional()
  trackStock?: boolean;

  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsOptional()
  stock?: number;

  @IsArray({ message: 'Los modificadores deben ser una lista.' })
  @IsString({ each: true, message: 'Cada ID de modificador debe ser un texto.' })
  @IsOptional()
  modifierGroupIds?: string[];
}

export class UpdateProductDto {
  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'La descripción debe ser un texto.' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'El precio debe ser un número válido.' })
  @IsOptional()
  price?: number;

  @IsString({ message: 'La URL de la imagen debe ser un texto.' })
  @IsOptional()
  imageUrl?: string;

  @IsUUID('all', { message: 'El ID de la categoría debe ser un UUID válido.' })
  @IsOptional()
  categoryId?: string;

  @IsBoolean({ message: 'El control de stock debe ser un valor booleano.' })
  @IsOptional()
  trackStock?: boolean;

  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsOptional()
  stock?: number;

  @IsArray({ message: 'Los modificadores deben ser una lista.' })
  @IsString({ each: true, message: 'Cada ID de modificador debe ser un texto.' })
  @IsOptional()
  modifierGroupIds?: string[];
}
