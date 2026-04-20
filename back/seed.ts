import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superPassword = await bcrypt.hash('super123', 10);
  
  // 0. Creando SuperAdmin global
  await prisma.user.upsert({
    where: { email: 'super@admin.com' },
    update: {},
    create: {
      email: 'super@admin.com',
      password: superPassword,
      role: 'SUPERADMIN'
    }
  });
  console.log('SuperAdmin creado exitosamente (super@admin.com / super123)');

  // 1. Creando la tienda 'demo-store'
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Tienda Premium de Demo',
      slug: 'demo-store',
      primaryColor: '#8b5cf6', // Indigo Premium
      users: {
        create: {
          email: 'admin@demostore.com',
          password: hashedPassword,
          role: 'STORE_ADMIN'
        }
      },
      products: {
        create: [
          {
            name: 'Auriculares Inalámbricos SoundPro',
            price: 199.99,
          },
          {
            name: 'Reloj Inteligente Quantum',
            price: 249.50,
          },
          {
            name: 'Teclado Mecánico RGB',
            price: 120.00,
          }
        ]
      }
    }
  });

  console.log('Tienda Demo y Productos creados exitosamente!');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
