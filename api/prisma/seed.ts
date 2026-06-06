import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // Limpa registros anteriores de funcionários (opcional, mas bom para reset)
  await prisma.employee.deleteMany({
    where: {
      email: 'admin@saiko.com',
    },
  });

  const hashedPassword = await bcrypt.hash('admin1234', 10);

  const admin = await prisma.employee.create({
    data: {
      name: 'Administrador Saiko',
      email: 'admin@saiko.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Created default admin: ${admin.email}`);
  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
