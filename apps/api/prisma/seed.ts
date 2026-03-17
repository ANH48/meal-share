import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });

async function main() {
  // Admin user (password hashing done in Phase 03 with bcrypt — using SHA256 placeholder here)
  const adminPasswordHash = crypto
    .createHash('sha256')
    .update('Admin@123456')
    .digest('hex');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mealshare.app' },
    update: {},
    create: {
      email: 'admin@mealshare.app',
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });

  console.log('Admin user:', admin.id);

  // Sample menu items
  const menuItems = [
    { name: 'Cơm tấm sườn bì chả', description: 'Broken rice with pork chop, skin and egg meatloaf', category: 'rice' },
    { name: 'Phở bò tái', description: 'Rare beef noodle soup', category: 'noodle' },
    { name: 'Bún bò Huế', description: 'Spicy Hue-style beef noodle soup', category: 'noodle' },
    { name: 'Bánh mì thịt', description: 'Vietnamese pork baguette sandwich', category: 'bread' },
    { name: 'Cơm gà xối mỡ', description: 'Crispy fried chicken rice', category: 'rice' },
    { name: 'Bún thịt nướng', description: 'Grilled pork vermicelli bowl', category: 'noodle' },
    { name: 'Cháo trắng heo quay', description: 'Plain rice porridge with roast pork', category: 'porridge' },
    { name: 'Mì xào hải sản', description: 'Stir-fried egg noodles with seafood', category: 'noodle' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: `00000000-0000-0000-0000-${String(menuItems.indexOf(item)).padStart(12, '0')}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${String(menuItems.indexOf(item)).padStart(12, '0')}`,
        ...item,
        createdBy: admin.id,
      },
    });
  }

  console.log(`Seeded ${menuItems.length} menu items`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
