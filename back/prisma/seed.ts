import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding...');

  // 1. Crear Super Admin por defecto
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      name: 'Administrador Inicial',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log(`✅ Usuario Admin creado: ${admin.email}`);

  // 2. Crear una tienda de ejemplo
  const demoStore = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      primaryColor: '#0ea5e9',
      secondaryColor: '#6366f1',
      hasConnectivity: true,
      hasOrderManagement: true,
    },
  });

  console.log(`✅ Tienda Demo creada: ${demoStore.slug}`);

  // 3. Vincular Admin a la Tienda
  await prisma.user.update({
    where: { id: admin.id },
    data: { storeId: demoStore.id }
  });

  // 4. Crear Categoría y productos base
  const category = await prisma.category.create({
    data: {
      name: 'General',
      slug: 'general',
      storeId: demoStore.id
    }
  });

  await prisma.product.createMany({
    data: [
      { name: 'Hamburguesa Especial', price: 8500, categoryId: category.id, storeId: demoStore.id },
      { name: 'Papas Fritas', price: 3500, categoryId: category.id, storeId: demoStore.id },
      { name: 'Refresco 500ml', price: 1500, categoryId: category.id, storeId: demoStore.id },
    ]
  });

  // 5. Crear Mesas base
  await prisma.table.createMany({
    data: [
      { number: '1', storeId: demoStore.id },
      { number: '2', storeId: demoStore.id },
      { number: '3', storeId: demoStore.id },
      { number: '4', storeId: demoStore.id },
    ]
  });

  console.log('🚀 Seeding completado con datos de prueba.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
