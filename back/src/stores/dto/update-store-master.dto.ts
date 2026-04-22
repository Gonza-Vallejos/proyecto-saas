import { IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class UpdateStoreMasterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsBoolean()
  @IsOptional()
  hasStockControl?: boolean;

  @IsBoolean()
  @IsOptional()
  hasPayments?: boolean;

  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  ownerPassword?: string;

  @IsString()
  @IsOptional()
  slug?: string;

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
}
