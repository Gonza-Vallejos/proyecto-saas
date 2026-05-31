import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsString()
  @IsOptional()
  superadminMpAccessToken?: string;

  @IsString()
  @IsOptional()
  superadminMpPublicKey?: string;

  @IsNumber()
  @IsOptional()
  defaultSubscriptionPrice?: number;
}
