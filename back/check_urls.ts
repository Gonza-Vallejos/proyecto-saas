import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUrls() {
  console.log('--- Checking Store Logos ---');
  const stores = await prisma.store.findMany({ select: { name: true, logoUrl: true } });
  stores.forEach(s => console.log(`${s.name}: ${s.logoUrl}`));

  console.log('\n--- Checking Product Images ---');
  const products = await prisma.product.findMany({ select: { name: true, imageUrl: true }, take: 10 });
  products.forEach(p => console.log(`${p.name}: ${p.imageUrl}`));

  await prisma.$disconnect();
}

checkUrls().catch(console.error);
