import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
  
  @Post()
  @UseGuards(JwtAuthGuard) // Solo usuarios autenticados pueden subir archivos
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
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
  uploadFile(@UploadedFile() file: any, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    
    // Devolvemos la URL pública del archivo
    // En un entorno real esto debería venir de una variable de entorno
    const host = req.get('host');
    // Forzamos http para evitar problemas de detección de protocolo en red local
    const url = `http://${host}/uploads/${file.filename}`;
    return { url };
  }
}
