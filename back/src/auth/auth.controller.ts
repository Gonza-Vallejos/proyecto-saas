import { Controller, Post, Body, Get, UseGuards, Request, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterSuperadminDto, UpdateProfileDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('register-superadmin')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerSuperadmin(@Body() body: RegisterSuperadminDto) {
    return this.authService.registerSuperadmin(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, body);
  }
}
