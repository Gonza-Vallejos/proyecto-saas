import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password!: string;
}

export class RegisterSuperadminDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  secretKey!: string; // Only people with this key can register as superadmin
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(4, { message: 'La nueva contraseña debe tener al menos 4 caracteres' })
  password?: string;
}
