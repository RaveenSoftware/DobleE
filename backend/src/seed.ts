import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('caja123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@doblee.com' },
    update: {},
    create: { name: 'Administrador DobleE', email: 'admin@doblee.com', password: adminPassword, role: 'admin' }
  });
  await prisma.user.upsert({
    where: { email: 'cajero@doblee.com' },
    update: {},
    create: { name: 'Cajero Principal', email: 'cajero@doblee.com', password: cashierPassword, role: 'mesero' }
  });

  console.log('✅ Users seeded (admin@doblee.com / admin123)');

  // ── Toppings ──────────────────────────────────────────────
  const toppingsData = [
    { name: 'Chamoy Líquido', category: 'Salsas', price: 1000, cost: 300 },
    { name: 'Tamarindo en Polvo', category: 'Salsas', price: 500, cost: 150 },
    { name: 'Chile Tajín', category: 'Salsas', price: 500, cost: 120 },
    { name: 'Mango Biche Picado', category: 'Fruta picada', price: 2000, cost: 800 },
    { name: 'Fresa Fresca', category: 'Fruta picada', price: 2000, cost: 700 },
    { name: 'Maracuyá Natural', category: 'Fruta picada', price: 2000, cost: 900 },
    { name: 'Gomitas Ácidas', category: 'Gomitas & Dulces', price: 1500, cost: 600 },
    { name: 'Palitos de Chile', category: 'Gomitas & Dulces', price: 1000, cost: 400 },
    { name: 'Nucitas', category: 'Crocante & Lácteos', price: 1500, cost: 500 },
    { name: 'Leche Condensada', category: 'Crocante & Lácteos', price: 1000, cost: 300 },
  ];

  for (const t of toppingsData) {
    await prisma.topping.upsert({
      where: { id: t.name },
      update: {},
      create: { id: `top-${toppingsData.indexOf(t) + 1}`, ...t }
    });
  }

  console.log('✅ Toppings seeded (10 toppings)');

  // ── Products ─────────────────────────────────────────────
  const productsData = [
    {
      name: 'Granizado Mango Biche',
      category: 'Frutales',
      description: 'El clásico granizado de mango biche con toque de limón criollo.',
      basePrice: 8000,
      baseCost: 2500,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
      isPopular: true,
      flavors: ['Mango Biche', 'Limón Criollo'],
    },
    {
      name: 'Granizado Fresa & Crema',
      category: 'Cremosos',
      description: 'Granizado de fresa con leche condensada y crema de leche.',
      basePrice: 9000,
      baseCost: 3200,
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80',
      isPopular: true,
      flavors: ['Fresa', 'Crema de Leche'],
    },
    {
      name: 'Granizado Maracuyá Picante',
      category: 'Cítricos & Chamoy',
      description: 'Granizado de maracuyá con limón biche y chamoy especial.',
      basePrice: 8500,
      baseCost: 2800,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80',
      isPopular: false,
      flavors: ['Maracuyá', 'Limón Biche'],
    },
  ];

  for (const [i, p] of productsData.entries()) {
    await prisma.product.upsert({
      where: { id: `prod-${i + 1}` },
      update: {},
      create: {
        id: `prod-${i + 1}`,
        ...p,
        flavors: JSON.stringify(p.flavors),
        isAvailable: true,
      }
    });
  }

  console.log('✅ Products seeded (3 products)');
  console.log('\n🎉 Database seeded successfully!\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
