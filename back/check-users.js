const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Listando Usuarios en la Base de Datos ---');
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      name: true
    }
  });
  
  if (users.length === 0) {
    console.log('No se encontraron usuarios en la base de datos.');
  } else {
    users.forEach(u => {
      console.log(`Email: ${u.email} | Rol: ${u.role} | Nombre: ${u.name || 'N/A'}`);
    });
  }
}

main()
  .catch(e => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
