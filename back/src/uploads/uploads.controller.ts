import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseService } from './supabase.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly supabaseService: SupabaseService) {}
  
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen (jpg, png, webp, gif)'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    
    // Subir a Supabase Storage y obtener la URL pública
    const url = await this.supabaseService.uploadImage(file);
    
    return { url };
  }
}
