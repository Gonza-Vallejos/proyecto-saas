import { IsString, IsEmail, IsOptional, IsBoolean, IsNotEmpty, MinLength } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(6)
  ownerPassword!: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsString()
  @IsOptional()
  iconColor?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsBoolean()
  @IsOptional()
  hasStockControl?: boolean;

  @IsBoolean()
  @IsOptional()
  hasPayments?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCart?: boolean;

  @IsBoolean()
  @IsOptional()
  isCatalogOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  hasModifiers?: boolean;

  @IsBoolean()
  @IsOptional()
  showObservations?: boolean;

  @IsBoolean()
  @IsOptional()
  hasConnectivity?: boolean;

  @IsBoolean()
  @IsOptional()
  hasOrderManagement?: boolean;

  @IsBoolean()
  @IsOptional()
  hasWhatsAppOrders?: boolean;

  @IsBoolean()
  @IsOptional()
  hasPOS?: boolean;

  @IsBoolean()
  @IsOptional()
  hasMercadoPago?: boolean;

  @IsString()
  @IsOptional()
  mercadoPagoAccessToken?: string;

  @IsString()
  @IsOptional()
  mercadoPagoPublicKey?: string;
}
