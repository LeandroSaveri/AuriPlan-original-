#!/usr/bin/env node
// ============================================
// SEED SCRIPT - Popula o Banco de Dados
// ============================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create furniture categories
  const categories = [
    { id: 'living', name: 'Living Room', slug: 'living', description: 'Sofas, chairs, tables', icon: 'sofa' },
    { id: 'bedroom', name: 'Bedroom', slug: 'bedroom', description: 'Beds, nightstands, dressers', icon: 'bed' },
    { id: 'kitchen', name: 'Kitchen', slug: 'kitchen', description: 'Tables, chairs, appliances', icon: 'utensils' },
    { id: 'bathroom', name: 'Bathroom', slug: 'bathroom', description: 'Vanities, toilets, tubs', icon: 'bath' },
    { id: 'lighting', name: 'Lighting', slug: 'lighting', description: 'Lamps, chandeliers, pendants', icon: 'lightbulb' },
    { id: 'decor', name: 'Decor', slug: 'decor', description: 'Plants, art, accessories', icon: 'palette' },
    { id: 'office', name: 'Office', slug: 'office', description: 'Desks, chairs, storage', icon: 'briefcase' },
    { id: 'appliances', name: 'Appliances', slug: 'appliances', description: 'Fridges, stoves, washers', icon: 'monitor' },
  ];

  for (const category of categories) {
    await prisma.furnitureCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('✓ Furniture categories created');

  // Create sample furniture items
  const furnitureItems = [
    {
      name: 'Modern Sofa 3-Seat',
      type: 'sofa',
      categoryId: 'living',
      description: 'Comfortable modern sofa with clean lines',
      price: 2499,
      isPopular: true,
      data: {
        defaultDimensions: { width: 2.2, height: 0.85, depth: 0.95 },
        defaultColor: '#808080',
      },
    },
    {
      name: 'Coffee Table Wood',
      type: 'coffee-table',
      categoryId: 'living',
      description: 'Solid wood coffee table',
      price: 899,
      isPopular: true,
      data: {
        defaultDimensions: { width: 1.2, height: 0.45, depth: 0.6 },
        defaultColor: '#C4A77D',
      },
    },
    {
      name: 'King Size Bed',
      type: 'bed',
      categoryId: 'bedroom',
      description: 'Luxurious king size bed',
      price: 3499,
      isPopular: true,
      data: {
        defaultDimensions: { width: 2.0, height: 1.1, depth: 2.2 },
        defaultColor: '#5D4E37',
      },
    },
    {
      name: 'Dining Table 6-Seat',
      type: 'dining-table',
      categoryId: 'kitchen',
      description: 'Elegant dining table for 6 people',
      price: 2499,
      isPopular: true,
      data: {
        defaultDimensions: { width: 1.8, height: 0.75, depth: 0.9 },
        defaultColor: '#C4A77D',
      },
    },
    {
      name: 'Modern Chandelier',
      type: 'chandelier',
      categoryId: 'lighting',
      description: 'Stunning modern chandelier',
      price: 3999,
      isPremium: true,
      data: {
        defaultDimensions: { width: 0.8, height: 1.0, depth: 0.8 },
        defaultColor: '#C0C0C0',
      },
    },
  ];

  for (const item of furnitureItems) {
    await prisma.furnitureItem.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: item.name.toLowerCase().replace(/\s+/g, '-'),
        ...item,
        tags: [item.type, item.categoryId, 'popular'],
      },
    });
  }
  console.log('✓ Furniture items created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@auriplan.com' },
    update: {},
    create: {
      email: 'admin@auriplan.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  });
  console.log('✓ Admin user created');

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
