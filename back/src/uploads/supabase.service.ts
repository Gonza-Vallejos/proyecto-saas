import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase URL o Key no encontradas en el .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadImage(file: Express.Multer.File) {
    const bucket = process.env.SUPABASE_BUCKET || 'images';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('❌ Error cargando a Supabase:', error);
      throw new BadRequestException(`Error al subir imagen a Supabase: ${error.message}`);
    }

    // Obtener URL pública
    const { data: publicData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  }
}
