import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Limpiando usuarios anteriores...');

  // Borrar todos los usuarios existentes (limpieza total)
  await prisma.user.deleteMany({});

  console.log('✅ Usuarios anteriores eliminados.');
  console.log('🔐 Creando usuario administrador...');

  const hashedPassword = await bcrypt.hash('Kira22', 12);

  const superadmin = await prisma.user.create({
    data: {
      name: 'Jahir (SaaS Owner)',
      email: 'jahir@doblee.com',
      password: hashedPassword,
      role: 'superadmin',
    },
  });

  console.log(`✅ Usuario creado:`);
  console.log(`   Nombre : ${superadmin.name}`);
  console.log(`   Correo : ${superadmin.email}`);
  console.log(`   Rol    : ${superadmin.role}`);
  console.log('');
  console.log('🍧 Base de datos lista. ¡Bienvenido, Jahir!');
}

main()
  .catch((e) => {
    console.error('❌ Error al crear usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
