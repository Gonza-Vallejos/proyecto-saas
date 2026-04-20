import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Seguridad: Cabeceras HTTP seguras
  // Seguridad: Cabeceras HTTP seguras (Configurado para permitir imágenes Cross-Origin en desarrollo)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Seguridad: Configuración de CORS refinada
  app.enableCors({
    origin: '*', // En producción, cambiar por los dominios permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Validation: Asegura que los datos entrantes sigan los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades que no estén en el DTO
    forbidNonWhitelisted: true, // Lanza error si hay propiedades extras
    transform: true, // Transforma los tipos automáticamente (ej: string a number)
    exceptionFactory: (errors) => {
      const messages = errors.map((err) => {
        const constraints = Object.values(err.constraints || {});
        // Traducción básica de errores comunes
        return constraints.map(c => {
          let msg = c;
          if (msg.includes('should not exist')) msg = `La propiedad ${err.property} no debería existir.`;
          if (msg.includes('must be a string')) msg = `${err.property} debe ser un texto.`;
          if (msg.includes('must be a number')) msg = `${err.property} debe ser un número.`;
          if (msg.includes('must be a boolean')) msg = `${err.property} debe ser un valor booleano (verdadero/falso).`;
          if (msg.includes('must be an array')) msg = `${err.property} debe ser una lista.`;
          if (msg.includes('is not a valid hex color')) msg = `${err.property} debe ser un color hexadecimal válido.`;
          if (msg.includes('must be an UUID')) msg = `${err.property} debe ser un ID único válido (UUID).`;
          return msg;
        }).join(', ');
      });
      return new BadRequestException(messages.join('. '));
    },
  }));

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
