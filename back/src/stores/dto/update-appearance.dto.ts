import { IsString, IsOptional, IsHexColor, IsUrl, IsIn } from 'class-validator';

export class UpdateStoreAppearanceDto {
  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'La descripción debe ser un texto.' })
  @IsOptional()
  description?: string;

  @IsHexColor({ message: 'El color primario debe ser un código hexadecimal válido (ej: #FFFFFF).' })
  @IsOptional()
  primaryColor?: string;

  @IsString({ message: 'El color secundario debe ser un texto hexadecimal.' })
  @IsOptional()
  secondaryColor?: string;

  @IsString({ message: 'El color de fondo debe ser un texto hexadecimal.' })
  @IsOptional()
  bgColor?: string;
  
  @IsHexColor({ message: 'El color de texto debe ser un código hexadecimal válido (ej: #FFFFFF).' })
  @IsOptional()
  textColor?: string;

  @IsHexColor({ message: 'El color de iconos debe ser un código hexadecimal válido (ej: #FFFFFF).' })
  @IsOptional()
  iconColor?: string;

  @IsString({ message: 'La fuente debe ser un texto.' })
  @IsOptional()
  fontFamily?: string;

  @IsString({ message: 'El estilo de tarjeta debe ser un texto.' })
  @IsOptional()
  cardStyle?: string;

  @IsString({ message: 'El estilo de cabecera debe ser un texto.' })
  @IsOptional()
  heroStyle?: string;

  @IsString({ message: 'La URL del logo debe ser un texto.' })
  @IsOptional()
  logoUrl?: string;

  @IsString({ message: 'La URL de la imagen de fondo debe ser un texto.' })
  @IsOptional()
  heroImageUrl?: string;

  @IsString({ message: 'El teléfono debe ser un texto.' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'El usuario de Instagram debe ser un texto.' })
  @IsOptional()
  instagram?: string;

  @IsString({ message: 'El enlace de Facebook debe ser un texto.' })
  @IsOptional()
  facebook?: string;

  @IsString({ message: 'El número de WhatsApp debe ser un texto.' })
  @IsOptional()
  whatsapp?: string;

  @IsString({ message: 'La dirección debe ser un texto.' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'Los horarios deben enviarse como una cadena de texto válida.' })
  @IsOptional()
  businessHours?: string;

  @IsString({ message: 'El nombre de la red WiFi debe ser un texto.' })
  @IsOptional()
  wifiSSID?: string;

  @IsString({ message: 'La contraseña del WiFi debe ser un texto.' })
  @IsOptional()
  wifiPassword?: string;
}
