const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'gonza18av@gmail.com';
  console.log(`Promoviendo a ${email} a SUPERADMIN...`);
  
  const user = await prisma.user.update({
    where: { email: email },
    data: { role: 'SUPERADMIN' }
  });
  
  console.log('✅ Usuario actualizado con éxito:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(async () => await prisma.$disconnect());
