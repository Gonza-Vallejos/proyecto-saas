import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { ModifiersModule } from './modifiers/modifiers.module';
import { CategoriesModule } from './categories/categories.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { UploadsController } from './uploads/uploads.controller';
import { SupabaseService } from './uploads/supabase.service';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    // Servir archivos estáticos de la carpeta uploads usando la ruta absoluta del proceso
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 20,
    }]),
    PrismaModule, 
    AuthModule, 
    StoresModule, 
    ProductsModule, 
    CategoriesModule,
    ModifiersModule,
    TablesModule,
    OrdersModule,
    UsersModule,
    EventsModule
  ],
  controllers: [AppController, UploadsController],
  providers: [
    AppService,
    SupabaseService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
