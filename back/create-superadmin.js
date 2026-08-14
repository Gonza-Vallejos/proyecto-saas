const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'gonza18av@gmail.com';
  console.log(`Creando super admin para ${email}...`);
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('El usuario ya existe, actualizando a SUPERADMIN...');
    await prisma.user.update({
      where: { email },
      data: { role: 'SUPERADMIN' }
    });
    console.log('✅ Listo!');
    return;
  }
  
  const user = await prisma.user.create({
    data: { 
      email: email,
      name: 'Gonzalo Vallejos',
      role: 'SUPERADMIN',
    }
  });
  
  console.log('✅ Usuario creado con éxito:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(async () => await prisma.$disconnect());
